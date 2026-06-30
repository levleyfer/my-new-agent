import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`shimmer ${className ?? ''}`} />;
}

export function LoadingSpinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      className={`block animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-400 ${className ?? ''}`}
      style={{ width: size, height: size }}
    />
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center dark:border-red-900/50 dark:bg-red-900/20">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <AlertCircle className="text-red-500 dark:text-red-400" size={22} />
      </div>
      <p className="font-semibold text-red-800 dark:text-red-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700"
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <Icon size={28} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
