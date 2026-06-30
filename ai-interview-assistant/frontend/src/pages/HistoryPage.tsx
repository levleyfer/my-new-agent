import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessions, deleteSession } from '../api';
import { useLangStore } from '../langStore';
import { translations } from '../i18n';
import { Trash2, ChevronRight, Mic, Clock } from 'lucide-react';
import { Skeleton, ErrorState, EmptyState } from '../components/ui';

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const limit = 10;
  const { lang } = useLangStore();
  const T = translations[lang];
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sessions', page],
    queryFn: () => getSessions({ limit, offset: page * limit }),
  });

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    if (!confirm(T.confirm_delete)) return;
    try {
      await deleteSession(id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    } catch {
      alert('Failed to delete session. Please try again.');
    }
  }

  function statusBadge(s: any) {
    if (s.status === 'completed' && s.overall_score !== null) {
      const color =
        s.overall_score >= 75
          ? 'text-emerald-600 dark:text-emerald-400'
          : s.overall_score >= 55
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-500 dark:text-red-400';
      return <span className={`text-sm font-bold ${color}`}>{s.overall_score}/100</span>;
    }
    if (s.status === 'processing')
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-900/50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Clock size={10} className="animate-spin" style={{ animationDuration: '2s' }} />
          {T.badge_processing}
        </span>
      );
    if (s.status === 'failed')
      return (
        <span className="rounded-full bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
          {T.badge_failed}
        </span>
      );
    return (
      <span className="rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {T.badge_pending}
      </span>
    );
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="fade-in max-w-3xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{T.history_title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{T.history_subtitle}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-card"
            >
              <Skeleton className="mb-2.5 h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={T.err_history} onRetry={() => refetch()} />
      ) : data?.items?.length === 0 ? (
        <EmptyState
          icon={Mic}
          title={T.empty_hist_title}
          description={T.empty_hist_desc}
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
        <>
          <div className="space-y-2.5">
            {data?.items?.map((s: any) => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-card transition-all hover:border-indigo-100 dark:hover:border-indigo-800 hover:shadow-card-hover"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {s.question_text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-400 capitalize">
                      {s.question_category}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {statusBadge(s)}
                  <button
                    onClick={(e) => handleDelete(e, s.id)}
                    className="rounded-lg p-1.5 text-gray-300 dark:text-gray-600 opacity-0 transition-all hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
                    aria-label={T.confirm_delete}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight
                    size={15}
                    className="text-gray-300 dark:text-gray-600 transition-colors group-hover:text-indigo-400 rtl:rotate-180"
                  />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {T.btn_prev}
              </button>
              <span className="px-3 text-sm text-gray-500 dark:text-gray-400">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {T.btn_next}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
