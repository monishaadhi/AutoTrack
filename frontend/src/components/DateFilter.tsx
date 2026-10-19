import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReset?: () => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
}) => {
  const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const dateStr = formatDate(today);
      onStartDateChange(dateStr);
      onEndDateChange(dateStr);
    } else if (preset === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      onStartDateChange(formatDate(pastWeek));
      onEndDateChange(formatDate(today));
    } else if (preset === 'month') {
      const pastMonth = new Date();
      pastMonth.setMonth(today.getMonth() - 1);
      onStartDateChange(formatDate(pastMonth));
      onEndDateChange(formatDate(today));
    } else if (preset === 'all') {
      onStartDateChange('');
      onEndDateChange('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs text-xs">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500 font-medium">From:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="text-slate-800 font-medium bg-transparent focus:outline-none"
        />
        <span className="text-slate-300">|</span>
        <span className="text-slate-500 font-medium">To:</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="text-slate-800 font-medium bg-transparent focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPreset('today')}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => setPreset('week')}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs transition-colors"
        >
          7 Days
        </button>
        <button
          onClick={() => setPreset('month')}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-xs transition-colors"
        >
          30 Days
        </button>
        {onReset && (
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-1.5 text-slate-500 bg-white border border-slate-200 rounded-md hover:text-slate-800 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
