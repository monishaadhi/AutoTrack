import React from 'react';
import { EmptyState } from './StateViews';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  keyExtractor?: (row: T, index: number) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-5 py-3.5">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-5 py-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const safeData: T[] = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as any).data)
    ? (data as any).data
    : [];

  if (safeData.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No records available'}
        description={emptyDescription || 'There are no entries to display for the current view.'}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {safeData.map((row, rowIndex) => {
              const key = keyExtractor
                ? keyExtractor(row, rowIndex)
                : row.id || row.record_id || row.line_id || row.issue_id || rowIndex;

              return (
                <tr
                  key={key}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map((col, colIndex) => {
                    const content =
                      typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor];

                    return (
                      <td
                        key={colIndex}
                        className={`px-5 py-3.5 text-sm ${col.className || ''}`}
                      >
                        {content !== null && content !== undefined ? content : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
