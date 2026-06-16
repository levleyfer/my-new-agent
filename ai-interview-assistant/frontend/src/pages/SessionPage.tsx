import { useRef, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { getSession, getSessionAudio } from "../api";
import { useLangStore } from "../langStore";
import { translations } from "../i18n";
import { CheckCircle, XCircle, ChevronLeft, Download, RotateCcw, MessageSquare } from "lucide-react";
import { Skeleton, ErrorState } from "../components/ui";

// ── Score ring (SVG) ─────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" className="stroke-gray-100 dark:stroke-gray-700" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="z-10 text-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">/100</span>
      </div>
    </div>
  );
}

// ── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, score, feedback }: { label: string; score: number; feedback: string }) {
  const barColor = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-red-400";
  const textColor = score >= 75 ? "text-emerald-600 dark:text-emerald-400" : score >= 55 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400";
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feedback}</p>
    </div>
  );
}

// ── Filler badge ─────────────────────────────────────────────────────────────
function Badge({ word, count }: { word: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
      "{word}" <span className="font-bold text-amber-800 dark:text-amber-300">×{count}</span>
    </span>
  );
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLangStore();
  const T = translations[lang];
  const resultsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [exporting, setExporting] = useState(false);

  const { data: session, isLoading, isError, refetch } = useQuery({
    queryKey: ["session", id],
    queryFn: () => getSession(id!),
    refetchInterval: (query: any) => query.state.data?.status === "processing" ? 3000 : false,
  });

  const status = session?.status;
  const analysis = session?.analysis;
  const transcript = session?.transcript;
  const question = session?.question;

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "completed") return;
    let cancelled = false;
    getSessionAudio(id!).then((url) => {
      if (!cancelled) setAudioUrl(url);
      else URL.revokeObjectURL(url);
    });
    return () => {
      cancelled = true;
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [id, status]);

  // Fix WebM duration metadata: MediaRecorder doesn't write duration in the header,
  // so the browser reports Infinity. Seeking to a large time forces it to scan the file.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const fixDuration = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e10;
      }
    };
    const onSeeked = () => {
      if (audio.currentTime >= 1e9) audio.currentTime = 0;
    };
    audio.addEventListener("loadedmetadata", fixDuration);
    audio.addEventListener("seeked", onSeeked);
    // Metadata may already be available if the URL was cached
    if (audio.readyState >= 1) fixDuration();
    return () => {
      audio.removeEventListener("loadedmetadata", fixDuration);
      audio.removeEventListener("seeked", onSeeked);
    };
  }, [audioUrl]);

  async function handleExport() {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(resultsRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", format: "a4" });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
      pdf.save(`interview-analysis-${id}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const backLink = (
    <Link to="/history" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
      <ChevronLeft size={15} className="rtl:rotate-180" />{T.back_history}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl fade-in">
        <Skeleton className="mb-6 h-4 w-28" />
        <div className="mb-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/20 p-5">
          <div className="mb-3 flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mb-1.5 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card flex items-center gap-8">
          <Skeleton className="h-36 w-36 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-36 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-4">
                <div className="mb-1.5 flex justify-between"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3.5 w-8" /></div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl">
        {backLink}
        <div className="mt-6"><ErrorState message={T.err_session} onRetry={() => refetch()} /></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl fade-in">
      {/* Top bar: back + action buttons */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {backLink}
        {status === "completed" && (
          <div className="flex items-center gap-2">
            {question?.id && (
              <Link to={`/practice?question_id=${question.id}`}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <RotateCcw size={12} />{T.btn_retry}
              </Link>
            )}
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-all">
              {exporting
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />{T.exporting}</>
                : <><Download size={12} />{T.btn_export}</>}
            </button>
          </div>
        )}
      </div>

      {/* Question card */}
      <div className="mb-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-5">
        <div className="mb-2.5 flex gap-2">
          <span className="rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-white/70 dark:bg-gray-800/60 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 capitalize">{question?.category}</span>
          <span className="rounded-full border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/60 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 capitalize">{question?.difficulty}</span>
        </div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">{question?.text}</p>
      </div>

      {/* Status banners */}
      {status === "pending" && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
          <div className="h-6 w-6 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">{T.status_pending}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{T.status_pending_sub}</p>
          </div>
        </div>
      )}

      {status === "processing" && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-5">
          <span className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">{T.status_analyzing}</p>
            <p className="mt-0.5 text-sm text-amber-600 dark:text-amber-400">{T.status_analyzing_sub}</p>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-5">
          <XCircle className="shrink-0 text-red-500" size={24} />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">{T.status_failed}</p>
            <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">{T.status_failed_sub}</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {status === "completed" && analysis && (
        <>
          {/* Audio playback — outside PDF capture */}
          {audioUrl && (
            <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{T.audio_title}</h2>
              <audio ref={audioRef} src={audioUrl} controls className="w-full rounded-xl" />
            </div>
          )}

        <div ref={resultsRef}>
          {/* Overall score + top dimensions */}
          <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={analysis.overall_score} />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{T.overall_score}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{new Date(analysis.created_at).toLocaleString()}</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{T.breakdown_title}</h2>
                <ScoreBar label={T.dim_clarity} score={analysis.clarity_score} feedback={analysis.clarity_feedback} />
                <ScoreBar label={T.dim_completeness} score={analysis.completeness_score} feedback={analysis.completeness_feedback} />
                <ScoreBar label={T.dim_communication} score={analysis.communication_score} feedback={analysis.communication_feedback} />
              </div>
            </div>
          </div>

          {/* More dimensions */}
          <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
            <ScoreBar label={T.dim_confidence} score={analysis.confidence_score} feedback={analysis.confidence_feedback} />
            <ScoreBar label={T.dim_star} score={analysis.star_method_score} feedback={analysis.star_method_feedback} />
            <ScoreBar label={T.dim_technical} score={analysis.technical_depth_score} feedback={analysis.technical_depth_feedback} />
          </div>

          {/* Filler words */}
          {analysis.filler_words?.length > 0 && (
            <div className="mb-5 rounded-2xl border border-amber-100 dark:border-amber-900/50 bg-white dark:bg-gray-800 p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{T.filler_title}</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.filler_words.map((fw: any, i: number) => <Badge key={i} word={fw.word} count={fw.count} />)}
              </div>
            </div>
          )}

          {/* Strengths / Weaknesses */}
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">{T.strengths_title}</h2>
              <ul className="space-y-2">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <span className="mt-0.5 shrink-0 font-bold">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-red-800 dark:text-red-300">{T.weaknesses_title}</h2>
              <ul className="space-y-2">
                {analysis.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-red-700 dark:text-red-400">
                    <span className="mt-0.5 shrink-0">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300">{T.suggestions_title}</h2>
            <ol className="list-decimal list-inside space-y-2">
              {analysis.suggestions.map((s: string, i: number) => (
                <li key={i} className="text-sm text-blue-700 dark:text-blue-400">{s}</li>
              ))}
            </ol>
          </div>

          {/* Follow-up questions */}
          {question?.follow_ups?.length > 0 && (
            <div className="mb-5 rounded-2xl border border-violet-100 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-900/20 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-800 dark:text-violet-300">
                <MessageSquare size={14} />{T.follow_ups_title}
              </h2>
              <div className="space-y-2.5">
                {question.follow_ups.map((fq: string, i: number) => (
                  <div key={i} className="flex gap-2.5 text-sm text-violet-700 dark:text-violet-400">
                    <span className="mt-0.5 shrink-0 font-bold text-violet-400 dark:text-violet-500">Q{i + 1}.</span>
                    <p>{fq}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improved answer */}
          <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{T.improved_title}</h2>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysis.improved_answer}</p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
              <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{T.transcript_title}</h2>
              <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{transcript.word_count} {T.unit_words} · {transcript.language.toUpperCase()}</p>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{transcript.text}</p>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}
