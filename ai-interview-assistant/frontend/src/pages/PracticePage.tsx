import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getQuestions, getRandomQuestion, getQuestion, createSession, uploadRecording } from "../api";
import { useLangStore } from "../langStore";
import { translations } from "../i18n";
import { Mic, MicOff, Upload, ChevronRight, RotateCcw, Search, Shuffle } from "lucide-react";
import { Skeleton, ErrorState, EmptyState } from "../components/ui";

type Step = "select" | "record";

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50",
  medium: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50",
  hard: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50",
};

export default function PracticePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLangStore();
  const T = translations[lang];

  const [step, setStep] = useState<Step>("select");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "stopped">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: questions, isLoading, isError, refetch } = useQuery({
    queryKey: ["questions", { category, difficulty }],
    queryFn: () => getQuestions({ category: category || undefined, difficulty: difficulty || undefined, limit: 50 }),
    enabled: step === "select",
  });

  // Auto-select question from URL param (retry flow)
  useEffect(() => {
    const qid = searchParams.get("question_id");
    if (qid) {
      getQuestion(qid).then(selectQuestion).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function selectQuestion(q: any) {
    setSelectedQuestion(q);
    setStep("record");
    setRecordingState("idle");
    setAudioBlob(null);
    setElapsed(0);
    setError("");
    try {
      const sess = await createSession(q.id);
      setSessionId(sess.id);
    } catch {
      setError(T.err_session_start);
    }
  }

  async function pickRandom() {
    try {
      const q = await getRandomQuestion({ category: category || undefined, difficulty: difficulty || undefined });
      selectQuestion(q);
    } catch {
      setError(T.empty_q_title);
    }
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { setAudioBlob(new Blob(chunksRef.current, { type: mimeType })); stream.getTracks().forEach((t) => t.stop()); };
      mr.start(250);
      setRecordingState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } catch {
      setError("Could not access microphone. Please allow microphone permissions.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setRecordingState("stopped");
  }

  async function handleUpload() {
    if (!audioBlob || !sessionId) return;
    setUploading(true);
    setError("");
    try {
      await uploadRecording(sessionId, audioBlob, elapsed);
      navigate(`/sessions/${sessionId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
      setUploading(false);
    }
  }

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");

  const selectCls = "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-200 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-all";

  if (step === "select") {
    return (
      <div className="fade-in max-w-3xl">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T.practice_title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{T.practice_subtitle}</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="">{T.cat_all}</option>
            <option value="behavioral">{T.cat_behavioral}</option>
            <option value="technical">{T.cat_technical}</option>
            <option value="situational">{T.cat_situational}</option>
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectCls}>
            <option value="">{T.diff_all}</option>
            <option value="easy">{T.diff_easy}</option>
            <option value="medium">{T.diff_medium}</option>
            <option value="hard">{T.diff_hard}</option>
          </select>
          <button onClick={pickRandom} className="ms-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
            <Shuffle size={14} />{T.btn_random}
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-card">
                <Skeleton className="mb-2.5 h-4 w-full" /><Skeleton className="mb-3 h-4 w-2/3" />
                <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={T.err_questions} onRetry={() => refetch()} />
        ) : questions?.items?.length === 0 ? (
          <EmptyState icon={Search} title={T.empty_q_title} description={T.empty_q_desc} />
        ) : (
          <div className="space-y-2.5">
            {questions?.items?.map((q: any) => (
              <button key={q.id} onClick={() => selectQuestion(q)}
                className="group w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-card text-start transition-all hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{q.text}</p>
                    <div className="mt-2.5 flex gap-2">
                      <span className="rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 capitalize">{q.category}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${DIFF_COLORS[q.difficulty] ?? "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"}`}>{q.difficulty}</span>
                    </div>
                  </div>
                  <ChevronRight size={17} className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600 transition-colors group-hover:text-indigo-400 rtl:rotate-180" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in max-w-2xl">
      <button onClick={() => setStep("select")} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
        <ChevronRight size={15} className="rotate-180 rtl:rotate-0" />{T.back_to_q}
      </button>

      <div className="mb-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-5">
        <div className="mb-3 flex gap-2">
          <span className="rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-white/60 dark:bg-gray-800/60 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 capitalize">{selectedQuestion?.category}</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${DIFF_COLORS[selectedQuestion?.difficulty] ?? ""}`}>{selectedQuestion?.difficulty}</span>
        </div>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">{selectedQuestion?.text}</p>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-card flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="font-mono text-5xl font-bold tracking-tight text-gray-900 dark:text-white">{mm}:{ss}</div>
          {elapsed > 150 && recordingState === "recording" && <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">{T.tip_long}</p>}
        </div>

        {recordingState === "idle" && (
          <button onClick={startRecording} className="group flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 transition-all hover:scale-105 hover:bg-red-600 active:scale-95">
            <Mic size={26} />
          </button>
        )}

        {recordingState === "recording" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-red-500"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />Recording</div>
            <button onClick={stopRecording} className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 text-white shadow-lg transition-all hover:scale-105 hover:bg-gray-800 dark:hover:bg-gray-600 active:scale-95">
              <MicOff size={24} />
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500">{T.btn_stop}</p>
          </div>
        )}

        {recordingState === "stopped" && (
          <div className="w-full flex flex-col items-center gap-4">
            {audioBlob && <audio src={URL.createObjectURL(audioBlob)} controls className="w-full rounded-xl" />}
            <div className="flex gap-3">
              <button onClick={() => { setRecordingState("idle"); setElapsed(0); setAudioBlob(null); }}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
                <RotateCcw size={14} />{T.btn_redo}
              </button>
              <button onClick={handleUpload} disabled={uploading}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.98]">
                {uploading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{T.uploading}</> : <><Upload size={14} />{T.btn_submit}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">{T.tip_recording}</p>
    </div>
  );
}
