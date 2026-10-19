import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: LucideIcon;
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'neutral',
  icon: Icon,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="w-9 h-9 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-40"></div>
      </div>
    );
  }

  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeStyles[badgeType]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
      )}
    </div>
  );
};
