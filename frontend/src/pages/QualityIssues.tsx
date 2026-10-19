import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { ErrorAlert, LoadingSpinner } from '../components/StateViews';
import { getQualityIssues, updateQualityIssueStatus } from '../api/quality';
import {
  QualityIssue,
  QualitySeverity,
  QualityStatus,
} from '../types/production';
import { useAuth } from '../context/AuthContext';

export const QualityIssues: React.FC = () => {
  const { hasRole } = useAuth();
  const canUpdateStatus = hasRole(['ADMIN', 'OPERATOR']);

  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getQualityIssues({
        page,
        limit: 10,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setIssues(list);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotalIssues(res?.pagination?.total ?? list.length);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch quality issues');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleStatusChange = async (issueId: number, newStatus: QualityStatus) => {
    try {
      setActionLoadingId(issueId);
      const updated = await updateQualityIssueStatus(issueId, newStatus);
      setIssues((prev) =>
        prev.map((item) => (item.issue_id === issueId ? updated : item))
      );
    } catch (err) {
      setError((err as Error).message || 'Failed to update issue status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getSeverityBadge = (severity: QualitySeverity) => {
    const config: Record<QualitySeverity, { label: string; bg: string; text: string; border: string }> = {
      CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      LOW: { label: 'Low', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    };
    const c = config[severity] || config.LOW;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
      >
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: QualityStatus) => {
    const config: Record<QualityStatus, { label: string; bg: string; text: string; border: string }> = {
      OPEN: { label: 'Open', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      IN_REVIEW: { label: 'In Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    };
    const c = config[status] || config.OPEN;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
      >
        {c.label}
      </span>
    );
  };

  const columns: Column<QualityIssue>[] = [
    {
      header: 'ID',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          QI-{String(row.issue_id).padStart(3, '0')}
        </span>
      ),
    },
    {
      header: 'Defect Description',
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-900 leading-snug">{row.description}</div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              {row.category}
            </span>
            <span>•</span>
            <span>{row.line_name || `Line #${row.line_id}`}</span>
            <span>•</span>
            <span>{row.factory_name}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: (row) => getSeverityBadge(row.severity),
    },
    {
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Reported At',
      accessor: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {row.created_at || '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => {
        if (!canUpdateStatus) {
          return (
            <span className="text-[11px] font-medium text-slate-400 italic">
              Read-only
            </span>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            {row.status !== 'IN_REVIEW' && row.status !== 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange(row.issue_id, 'IN_REVIEW')}
                disabled={actionLoadingId === row.issue_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <Clock className="w-3 h-3" />
                Review
              </button>
            )}
            {row.status !== 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange(row.issue_id, 'RESOLVED')}
                disabled={actionLoadingId === row.issue_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3 h-3" />
                Resolve
              </button>
            )}
            {row.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange(row.issue_id, 'OPEN')}
                disabled={actionLoadingId === row.issue_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quality Inspection & Defects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs, weld anomalies, torque tolerances, and defect resolution workflow
          </p>
        </div>

        {/* Severity counts pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-xs">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-slate-800">{totalIssues}</span>
            <span className="text-slate-500">Defects Tracked</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">Filter By:</span>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open Only</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <span className="ml-auto text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{issues.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalIssues}</span> issues
        </span>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadIssues} />}

      {/* Table */}
      <DataTable
        columns={columns}
        data={issues}
        loading={loading}
        emptyTitle="No quality defects found"
        emptyDescription="All inspection criteria nominal or no issues match the filters."
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="text-xs text-slate-600">
            Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading && issues.length === 0 && (
        <LoadingSpinner message="Loading quality inspection logs..." />
      )}
    </div>
  );
};
