import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading live telemetry...',
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{message}</p>
  </div>
);

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 my-4 flex items-start gap-4">
    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-red-900">Communication Error</h4>
      <p className="text-sm text-red-700 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded shadow-sm hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  </div>
);

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No production records or events match the selected criteria.',
  actionText,
  onAction,
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border border-slate-200">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
      <Inbox className="w-6 h-6 text-slate-400" />
    </div>
    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-4 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
      >
        {actionText}
      </button>
    )}
  </div>
);
