import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { BarChart2, TrendingUp, Award, MessageSquare, CheckSquare } from "lucide-react";
import {
  getAnalyticsSummary, getAnalyticsProgress, getAnalyticsWeaknesses,
  getAnalyticsFillerWords, getAnalyticsCategoryBreakdown,
} from "../api";
import { useLangStore } from "../langStore";
import { translations } from "../i18n";
import { Skeleton, ErrorState, EmptyState } from "../components/ui";

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: string | number | null; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
      </p>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #f1f5f9",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  fontSize: 13,
};

export default function AnalyticsPage() {
  const { lang } = useLangStore();
  const T = translations[lang];

  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: summaryRefetch } = useQuery({ queryKey: ["analytics-summary"], queryFn: getAnalyticsSummary, staleTime: 0 });
  const { data: progress, isLoading: progressLoading } = useQuery({ queryKey: ["analytics-progress"], queryFn: getAnalyticsProgress, staleTime: 0 });
  const { data: weaknesses, isLoading: weaknessLoading } = useQuery({ queryKey: ["analytics-weaknesses"], queryFn: getAnalyticsWeaknesses, staleTime: 0 });
  const { data: fillerWords, isLoading: fillerLoading } = useQuery({ queryKey: ["analytics-filler-words"], queryFn: getAnalyticsFillerWords, staleTime: 0 });
  const { data: categoryData, isLoading: categoryLoading } = useQuery({ queryKey: ["analytics-category"], queryFn: getAnalyticsCategoryBreakdown, staleTime: 0 });

  const progressData = progress?.data_points ?? [];
  const weaknessData = (weaknesses?.common_weaknesses ?? []).slice(0, 8);
  const fillerData = (fillerWords?.totals ?? []).slice(0, 8);
  const catData = (categoryData?.categories ?? []).map((c: any) => ({ ...c, category: c.category.charAt(0).toUpperCase() + c.category.slice(1) }));

  const anyLoading = summaryLoading || progressLoading || weaknessLoading || fillerLoading;
  const noData = progressData.length === 0 && weaknessData.length === 0;

  return (
    <div className="fade-in max-w-4xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T.analytics_title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{T.analytics_subtitle}</p>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-card">
              <Skeleton className="mb-4 h-3.5 w-28" /><Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : summaryError ? (
          <div className="col-span-full"><ErrorState message={T.err_analytics} onRetry={() => summaryRefetch()} /></div>
        ) : (
          <>
            <StatCard label={T.stat_avg_overall} value={summary?.avg_overall_score ?? null} icon={TrendingUp} iconBg="bg-indigo-50 dark:bg-indigo-900/40" iconColor="text-indigo-600 dark:text-indigo-400" />
            <StatCard label={T.stat_avg_clarity_a} value={summary?.avg_clarity_score ?? null} icon={Award} iconBg="bg-blue-50 dark:bg-blue-900/40" iconColor="text-blue-600 dark:text-blue-400" />
            <StatCard label={T.stat_avg_comm} value={summary?.avg_communication_score ?? null} icon={MessageSquare} iconBg="bg-violet-50 dark:bg-violet-900/40" iconColor="text-violet-600 dark:text-violet-400" />
            <StatCard label={T.stat_completed_a} value={summary?.completed_sessions ?? null} icon={CheckSquare} iconBg="bg-emerald-50 dark:bg-emerald-900/40" iconColor="text-emerald-600 dark:text-emerald-400" />
          </>
        )}
      </div>

      {/* Progress chart */}
      {progressLoading ? (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <Skeleton className="mb-5 h-5 w-52" /><Skeleton className="h-[220px] w-full" />
        </div>
      ) : progressData.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <h2 className="mb-5 text-[15px] font-semibold text-gray-900 dark:text-white">{T.chart_progress}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progressData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Category breakdown chart */}
      {categoryLoading ? (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <Skeleton className="mb-5 h-5 w-48" /><Skeleton className="h-[200px] w-full" />
        </div>
      ) : catData.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <h2 className="mb-5 text-[15px] font-semibold text-gray-900 dark:text-white">{T.chart_category}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}/100`, T.axis_score]} />
              <Bar dataKey="avg_score" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Weaknesses list */}
      {weaknessLoading ? (
        <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <Skeleton className="mb-5 h-5 w-48" />
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
        </div>
      ) : weaknessData.length > 0 ? (
        <div className="mb-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <h2 className="mb-5 text-[15px] font-semibold text-gray-900 dark:text-white">{T.chart_weaknesses}</h2>
          <div className="space-y-2.5">
            {weaknessData.map((w: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-[11px] font-bold text-red-500 dark:text-red-400">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-gray-700 dark:text-gray-200 leading-snug">{w.weakness}</p>
                {w.count > 1 && (
                  <span className="shrink-0 rounded-full bg-red-100 dark:bg-red-900/50 px-2 py-0.5 text-[11px] font-semibold text-red-500 dark:text-red-400">
                    ×{w.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Filler words chart */}
      {fillerLoading ? (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <Skeleton className="mb-5 h-5 w-36" /><Skeleton className="h-[200px] w-full" />
        </div>
      ) : fillerData.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-card">
          <h2 className="mb-5 text-[15px] font-semibold text-gray-900 dark:text-white">{T.chart_filler}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fillerData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="word" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
              <Tooltip contentStyle={{ ...tooltipStyle, fontSize: 12 }} />
              <Bar dataKey="total_count" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {!anyLoading && noData && (
        <EmptyState icon={BarChart2} title={T.empty_analytics_title} description={T.empty_analytics_desc}
          action={<Link to="/practice" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">{T.start_practicing}</Link>} />
      )}
    </div>
  );
}
