import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Target,
  TrendingUp,
  AlertOctagon,
  Clock,
  ArrowRight,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { ProductionChart } from '../components/ProductionChart';
import { DateFilter } from '../components/DateFilter';
import { DataTable, Column } from '../components/DataTable';
import { ErrorAlert, LoadingSpinner, EmptyState } from '../components/StateViews';
import { getDashboardSummary, getDashboardTrends } from '../api/dashboard';
import { getQualityIssues } from '../api/quality';
import { getProductionLines } from '../api/lines';
import {
  DashboardSummary,
  DailyTrendPoint,
  QualityIssue,
  ProductionLine,
} from '../types/production';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [recentIssues, setRecentIssues] = useState<QualityIssue[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Perform requests in parallel, handling partial degradation safely
      const [summaryRes, trendsRes, qualityRes, linesRes] = await Promise.allSettled([
        getDashboardSummary({
          from: startDate || undefined,
          to: endDate || undefined,
        }),
        getDashboardTrends({
          from: startDate || undefined,
          to: endDate || undefined,
        }),
        getQualityIssues({
          limit: 5,
          from: startDate || undefined,
          to: endDate || undefined,
        }),
        getProductionLines(),
      ]);

      const errors: string[] = [];

      // 1. Process Summary
      if (summaryRes.status === 'fulfilled') {
        const raw = summaryRes.value as any;
        const s = raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw;
        setSummary(s || null);
      } else {
        errors.push(`Summary: ${summaryRes.reason?.message || 'Failed to fetch summary'}`);
      }

      // 2. Process Daily Trends
      if (trendsRes.status === 'fulfilled') {
        const raw = trendsRes.value as any;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        setTrends(list);
      } else {
        errors.push(`Trends: ${trendsRes.reason?.message || 'Failed to fetch trends'}`);
      }

      // 3. Process Quality Issues
      if (qualityRes.status === 'fulfilled') {
        const raw = qualityRes.value as any;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        setRecentIssues(list);
      } else {
        errors.push(`Quality Alerts: ${qualityRes.reason?.message || 'Failed to fetch quality issues'}`);
      }

      // 4. Process Production Lines
      if (linesRes.status === 'fulfilled') {
        const raw = linesRes.value as any;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        setLines(list);
      }

      if (errors.length > 0 && summaryRes.status === 'rejected') {
        setError(errors.join(' | '));
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Transform trend data for Recharts safely
  const chartData = (Array.isArray(trends) ? trends : []).map((t: any) => ({
    label: t.date || t.production_date || 'N/A',
    target: Number(t.target ?? t.target_quantity ?? 0),
    produced: Number(t.produced ?? t.produced_quantity ?? 0),
    defects: Number(t.defects ?? t.defect_count ?? 0),
  }));

  // Quality Issues Table Columns with case-insensitive normalization
  const getSeverityBadge = (severity?: string) => {
    const s = String(severity || 'LOW').toUpperCase();
    const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
      CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      LOW: { label: 'Low', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    };
    const c = config[s] || config.LOW;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
      >
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    const s = String(status || 'OPEN').toUpperCase();
    const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
      OPEN: { label: 'Open', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      IN_REVIEW: { label: 'In Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    };
    const c = config[s] || config.OPEN;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
      >
        {c.label}
      </span>
    );
  };

  const qualityColumns: Column<QualityIssue>[] = [
    {
      header: 'ID',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          QI-{String(row.issue_id || 0).padStart(3, '0')}
        </span>
      ),
    },
    {
      header: 'Description',
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-900 leading-snug">{row.description}</div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              {row.category}
            </span>
            <span>•</span>
            <span>{row.line_name || `Line #${row.line_id}`}</span>
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
      header: 'Reported',
      accessor: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {row.created_at || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manufacturing Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time output monitoring, throughput trends, and quality telemetry
          </p>
        </div>

        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReset={() => {
            setStartDate('');
            setEndDate('');
          }}
        />
      </div>

      {error && <ErrorAlert message={error} onRetry={loadDashboardData} />}

      {/* 1. Five Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Production Output"
          value={
            summary
              ? Number(summary.total_produced ?? 0).toLocaleString()
              : '—'
          }
          subtitle={
            summary
              ? `${Number(summary.total_records ?? 0)} shifts monitored`
              : 'Units assembled'
          }
          icon={Layers}
          loading={loading}
        />

        <KpiCard
          title="Production Target"
          value={
            summary
              ? Number(summary.total_target ?? 0).toLocaleString()
              : '—'
          }
          subtitle="Planned shift quota"
          icon={Target}
          loading={loading}
        />

        <KpiCard
          title="Target Achievement"
          value={
            summary
              ? `${Number(summary.target_achievement_percentage ?? 0).toFixed(1)}%`
              : '—'
          }
          badge={
            summary
              ? Number(summary.target_achievement_percentage ?? 0) >= 90
                ? 'Nominal'
                : 'Behind'
              : undefined
          }
          badgeType={
            summary && Number(summary.target_achievement_percentage ?? 0) >= 90
              ? 'success'
              : 'warning'
          }
          subtitle="Overall throughput rate"
          icon={TrendingUp}
          loading={loading}
        />

        <KpiCard
          title="Defect Rate"
          value={
            summary
              ? `${Number(summary.defect_rate_percentage ?? 0).toFixed(2)}%`
              : '—'
          }
          badge={
            summary
              ? Number(summary.defect_rate_percentage ?? 0) <= 3.0
                ? 'Target'
                : 'Elevated'
              : undefined
          }
          badgeType={
            summary && Number(summary.defect_rate_percentage ?? 0) <= 3.0
              ? 'success'
              : 'danger'
          }
          subtitle={
            summary
              ? `${Number(summary.total_defects ?? 0)} defects recorded`
              : 'Defect ratio'
          }
          icon={AlertOctagon}
          loading={loading}
        />

        <KpiCard
          title="Total Downtime"
          value={
            summary
              ? `${Number(summary.total_downtime_minutes ?? 0).toLocaleString()} min`
              : '—'
          }
          subtitle="Cumulative lost time"
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* 2. Secondary Line Health Banner */}
      {(() => {
        const breakdown = summary?.lines_breakdown || {
          total: lines.length,
          running: lines.filter((l) => String(l.status).toUpperCase() === 'RUNNING').length,
          maintenance: lines.filter((l) => String(l.status).toUpperCase() === 'MAINTENANCE').length,
          stopped: lines.filter((l) => String(l.status).toUpperCase() === 'STOPPED').length,
        };

        if (!summary && lines.length === 0) return null;

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Production Line Health
                </span>
                <div className="text-sm font-bold text-slate-800">
                  {breakdown.running} of {breakdown.total} Lines Operating
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{breakdown.running} Running</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{breakdown.maintenance} Maintenance</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{breakdown.stopped} Stopped</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Production vs Target Recharts Line Chart */}
      <ProductionChart
        title="Production vs Target Trends"
        subtitle="Daily planned target vs actual throughput"
        data={chartData}
        loading={loading}
        defaultChartType="line"
      />

      {/* 4. Recent Quality Issues Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Recent Quality Alerts</h3>
          </div>
          <Link
            to="/quality"
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>View all defect logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={qualityColumns}
          data={recentIssues}
          loading={loading}
          emptyTitle="No recent quality issues"
          emptyDescription="There are no unresolved defect alerts for this timeframe."
        />
      </div>

      {loading && !summary && trends.length === 0 && (
        <LoadingSpinner message="Querying live AutoTrack telemetry..." />
      )}

      {!loading && !summary && (
        <EmptyState
          title="No telemetry data found"
          description="Try selecting a wider date range or clearing your filter to view historical records."
          actionText="Reset Date Filter"
          onAction={() => {
            setStartDate('');
            setEndDate('');
          }}
        />
      )}
    </div>
  );
};
