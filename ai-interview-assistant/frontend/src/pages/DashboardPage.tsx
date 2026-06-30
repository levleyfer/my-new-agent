import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAnalyticsSummary, getSessions } from '../api';
import { useAuthStore } from '../store';
import { useLangStore } from '../langStore';
import { translations } from '../i18n';
import {
  Mic,
  Clock,
  TrendingUp,
  Award,
  CheckSquare,
  Zap,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Skeleton, ErrorState, EmptyState } from '../components/ui';

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  accent,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  accent: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-800 shadow-card transition-shadow hover:shadow-card-hover ${accent}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon size={17} className={iconColor} />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value !== null ? value : <span className="text-gray-300 dark:text-gray-600">—</span>}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { lang } = useLangStore();
  const T = translations[lang];

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: summaryRefetch,
  } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: getAnalyticsSummary,
    staleTime: 0,
  });
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: sessionsRefetch,
  } = useQuery({
    queryKey: ['sessions', { limit: 5 }],
    queryFn: () => getSessions({ limit: 5 }),
  });

  const score = summary?.avg_overall_score;
  const scoreColor =
    score == null
      ? 'text-gray-400'
      : score >= 75
        ? 'text-emerald-600 dark:text-emerald-400'
        : score >= 55
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-500 dark:text-red-400';

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {T.greeting}, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{T.dashboard_subtitle}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-card"
            >
              <Skeleton className="h-3.5 w-28 mb-4" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : summaryError ? (
          <div className="col-span-full">
            <ErrorState message={T.err_summary} onRetry={() => summaryRefetch()} />
          </div>
        ) : (
          <>
            <StatCard
              label={T.stat_avg_score}
              value={summary?.avg_overall_score ?? null}
              icon={TrendingUp}
              iconColor={scoreColor}
              iconBg="bg-indigo-50 dark:bg-indigo-900/40"
              accent="border-indigo-100 dark:border-indigo-900/50"
            />
            <StatCard
              label={T.stat_total}
              value={summary?.total_sessions ?? null}
              icon={Zap}
              iconColor="text-violet-600 dark:text-violet-400"
              iconBg="bg-violet-50 dark:bg-violet-900/40"
              accent="border-violet-100 dark:border-violet-900/50"
            />
            <StatCard
              label={T.stat_completed}
              value={summary?.completed_sessions ?? null}
              icon={CheckSquare}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBg="bg-emerald-50 dark:bg-emerald-900/40"
              accent="border-emerald-100 dark:border-emerald-900/50"
            />
            <StatCard
              label={T.stat_clarity}
              value={summary?.avg_clarity_score ?? null}
              icon={Award}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-50 dark:bg-blue-900/40"
              accent="border-blue-100 dark:border-blue-900/50"
            />
          </>
        )}
      </div>

      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{T.cta_title}</h2>
            <p className="mt-1 text-sm text-indigo-200">{T.cta_body}</p>
          </div>
          <Link
            to="/practice"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
          >
            <Mic size={15} />
            {T.cta_btn}
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            {T.recent_title}
          </h2>
          <Link
            to="/history"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {T.view_all}
            <ArrowRight size={14} />
          </Link>
        </div>

        {sessionsLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-card"
              >
                <Skeleton className="h-4 w-3/4 mb-2.5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : sessionsError ? (
          <ErrorState message={T.err_recent} onRetry={() => sessionsRefetch()} />
        ) : sessions?.items?.length === 0 ? (
          <EmptyState
            icon={Mic}
            title={T.empty_sessions_title}
            description={T.empty_sessions_desc}
            action={
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Mic size={14} />
                {T.start_first}
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {sessions?.items?.map((s: any) => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-card transition-all hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-card-hover"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {s.question_text}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {s.question_category} · {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="ms-4 flex items-center gap-3 shrink-0">
                  {s.status === 'completed' && s.overall_score !== null ? (
                    <span
                      className={`text-sm font-bold ${s.overall_score >= 75 ? 'text-emerald-600 dark:text-emerald-400' : s.overall_score >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}
                    >
                      {s.overall_score}/100
                    </span>
                  ) : s.status === 'processing' ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Clock
                        size={11}
                        className="animate-spin"
                        style={{ animationDuration: '2s' }}
                      />
                      {T.processing}
                    </span>
                  ) : s.status === 'failed' ? (
                    <span className="rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                      {T.badge_failed}
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {T.badge_pending}
                    </span>
                  )}
                  <ChevronRight
                    size={15}
                    className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors rtl:rotate-180"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
