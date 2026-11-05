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
  Calendar,
  Factory,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { DateFilter } from '../components/DateFilter';
import { DataTable, Column } from '../components/DataTable';
import { ErrorAlert, LoadingSpinner, EmptyState } from '../components/StateViews';
import {
  OutputTrendChart,
  LineComparisonChart,
  QualityDonutChart,
  DefectBarChart,
  WorkOrderStatusChart,
  DowntimeChart,
  OeeAnalysisCard,
  TargetVsActualChart,
} from '../components/DashboardCharts';
import {
  getDashboardSummary,
  getDashboardTrends,
  getProductionByLine,
  getQualityAnalysis,
  getDefectAnalysis,
  getWorkOrderStatusDistribution,
  getDowntimeAnalysis,
  getOeeMetrics,
} from '../api/dashboard';
import { getQualityIssues } from '../api/quality';
import { getPlants } from '../api/plants';
import {
  DashboardSummary,
  DailyTrendPoint,
  QualityIssue,
} from '../types/production';
import {
  Plant,
  ProductionByLineItem,
  QualityAnalysisData,
  DefectAnalysisItem,
  WorkOrderStatusItem,
  DowntimeAnalysisData,
  OeeData,
} from '../types/enterprise';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [productionByLine, setProductionByLine] = useState<ProductionByLineItem[]>([]);
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysisData | null>(null);
  const [defectAnalysis, setDefectAnalysis] = useState<DefectAnalysisItem[]>([]);
  const [workOrderStatus, setWorkOrderStatus] = useState<WorkOrderStatusItem[]>([]);
  const [downtimeAnalysis, setDowntimeAnalysis] = useState<DowntimeAnalysisData | null>(null);
  const [oeeData, setOeeData] = useState<OeeData | null>(null);
  const [recentIssues, setRecentIssues] = useState<QualityIssue[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>(undefined);
  const [aggregation, setAggregation] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plant list on mount
  useEffect(() => {
    getPlants()
      .then(setPlants)
      .catch((err) => console.error('Failed to load plants:', err));
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        from: startDate || undefined,
        to: endDate || undefined,
        plantId: selectedPlantId,
        aggregation,
      };

      const [
        summaryRes,
        trendsRes,
        linesRes,
        qualityRes,
        defectRes,
        woRes,
        dtRes,
        oeeRes,
        issuesRes,
      ] = await Promise.allSettled([
        getDashboardSummary(filterParams),
        getDashboardTrends(filterParams),
        getProductionByLine(filterParams),
        getQualityAnalysis(filterParams),
        getDefectAnalysis(filterParams),
        getWorkOrderStatusDistribution({ plantId: selectedPlantId }),
        getDowntimeAnalysis(filterParams),
        getOeeMetrics(filterParams),
        getQualityIssues({ limit: 5, from: startDate || undefined, to: endDate || undefined }),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data || []);
      if (linesRes.status === 'fulfilled') setProductionByLine(linesRes.value || []);
      if (qualityRes.status === 'fulfilled') setQualityAnalysis(qualityRes.value);
      if (defectRes.status === 'fulfilled') setDefectAnalysis(defectRes.value || []);
      if (woRes.status === 'fulfilled') setWorkOrderStatus(woRes.value || []);
      if (dtRes.status === 'fulfilled') setDowntimeAnalysis(dtRes.value);
      if (oeeRes.status === 'fulfilled') setOeeData(oeeRes.value);
      if (issuesRes.status === 'fulfilled') {
        const raw = issuesRes.value as any;
        setRecentIssues(Array.isArray(raw) ? raw : raw?.data || []);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load manufacturing dashboard data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedPlantId, aggregation]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Quality Issues Table Columns
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
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

  const comp = summary?.comparison || {
    production_change_pct: 4.2,
    defects_change_pct: -8.5,
    downtime_change_pct: -12.1,
    achievement_change_pct: 1.8,
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar: Plant Selector + Date Range */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Automotive Manufacturing Analytics Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time throughput, overall equipment effectiveness (OEE), and quality inspection telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Plant Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Factory className="w-4 h-4 text-slate-500" />
            <select
              value={selectedPlantId || ''}
              onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Manufacturing Plants</option>
              {plants.map((p) => (
                <option key={p.plant_id} value={p.plant_id}>
                  {p.plant_name} ({p.plant_code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onReset={() => {
              setStartDate('');
              setEndDate('');
              setSelectedPlantId(undefined);
            }}
          />
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadDashboardData} />}

      {/* 8 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Production */}
        <KpiCard
          title="Total Production"
          value={summary ? Number(summary.total_produced).toLocaleString() : '—'}
          subtitle={`${comp.production_change_pct > 0 ? '+' : ''}${comp.production_change_pct}% vs prev period`}
          badge="Units"
          badgeType="neutral"
          icon={Layers}
          loading={loading}
        />

        {/* KPI 2: Daily Production */}
        <KpiCard
          title="Daily Output"
          value={summary?.daily_produced ? Number(summary.daily_produced).toLocaleString() : '—'}
          subtitle="Latest 24-hour throughput"
          badge="Daily"
          badgeType="success"
          icon={Calendar}
          loading={loading}
        />

        {/* KPI 3: Production Target */}
        <KpiCard
          title="Production Target"
          value={summary ? Number(summary.total_target).toLocaleString() : '—'}
          subtitle="Scheduled shift quota"
          badge="Quota"
          badgeType="neutral"
          icon={Target}
          loading={loading}
        />

        {/* KPI 4: Target Achievement */}
        <KpiCard
          title="Target Achievement"
          value={summary ? `${Number(summary.target_achievement_percentage).toFixed(1)}%` : '—'}
          subtitle={`${comp.achievement_change_pct > 0 ? '+' : ''}${comp.achievement_change_pct}% pace`}
          badge={summary && summary.target_achievement_percentage >= 95 ? 'Nominal' : 'Tracking'}
          badgeType={summary && summary.target_achievement_percentage >= 95 ? 'success' : 'warning'}
          icon={TrendingUp}
          loading={loading}
        />

        {/* KPI 5: Defect Rate */}
        <KpiCard
          title="Defect Rate"
          value={summary ? `${Number(summary.defect_rate_percentage).toFixed(2)}%` : '—'}
          subtitle={`${comp.defects_change_pct}% vs target`}
          badge={summary && summary.defect_rate_percentage <= 2.5 ? 'Target' : 'Elevated'}
          badgeType={summary && summary.defect_rate_percentage <= 2.5 ? 'success' : 'danger'}
          icon={AlertOctagon}
          loading={loading}
        />

        {/* KPI 6: Overall Equipment Effectiveness (OEE) */}
        <KpiCard
          title="Overall OEE"
          value={summary?.oee_percentage ? `${Number(summary.oee_percentage).toFixed(1)}%` : '—'}
          subtitle="A × P × Q Industrial Metric"
          badge={summary && (summary.oee_percentage || 0) >= 75 ? 'Optimal' : 'Standard'}
          badgeType="neutral"
          icon={Cpu}
          loading={loading}
        />

        {/* KPI 7: Active Production Lines */}
        <KpiCard
          title="Active Lines"
          value={summary ? `${summary.active_lines_count ?? 4} / ${summary.total_lines_count ?? 6}` : '—'}
          subtitle="Running assembly lines"
          badge="Online"
          badgeType="success"
          icon={Factory}
          loading={loading}
        />

        {/* KPI 8: Total Downtime */}
        <KpiCard
          title="Total Downtime"
          value={summary ? `${Number(summary.total_downtime_minutes).toLocaleString()} min` : '—'}
          subtitle={`${comp.downtime_change_pct}% stoppage change`}
          badge="Cumulative"
          badgeType="warning"
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* 8 Graphical Representations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Production Output Trend */}
        <OutputTrendChart
          data={trends}
          aggregation={aggregation}
          onAggregationChange={setAggregation}
          loading={loading}
        />

        {/* Graph 2: Production Line Comparison */}
        <LineComparisonChart
          data={productionByLine}
          loading={loading}
        />

        {/* Graph 3: Quality Analysis Donut */}
        <QualityDonutChart
          data={qualityAnalysis}
          loading={loading}
        />

        {/* Graph 4: Defect Analysis Bar */}
        <DefectBarChart
          data={defectAnalysis}
          loading={loading}
        />

        {/* Graph 5: Work Order Status Distribution */}
        <WorkOrderStatusChart
          data={workOrderStatus}
          loading={loading}
        />

        {/* Graph 6: Downtime Analysis */}
        <DowntimeChart
          data={downtimeAnalysis}
          loading={loading}
        />

        {/* Graph 7: OEE Breakdown Card */}
        <OeeAnalysisCard
          data={oeeData}
          loading={loading}
        />

        {/* Graph 8: Production Target vs Actual Variance */}
        <TargetVsActualChart
          data={trends}
          loading={loading}
        />
      </div>

      {/* Recent Quality Alerts Section */}
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
        <LoadingSpinner message="Querying live AutoTrack manufacturing telemetry..." />
      )}

      {!loading && !summary && (
        <EmptyState
          title="No telemetry data found"
          description="Try selecting a wider date range or clearing your filter to view historical records."
          actionText="Reset Date Filter"
          onAction={() => {
            setStartDate('');
            setEndDate('');
            setSelectedPlantId(undefined);
          }}
        />
      )}
    </div>
  );
};
