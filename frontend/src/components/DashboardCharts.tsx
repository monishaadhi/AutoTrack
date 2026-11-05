import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart2,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import {
  ProductionByLineItem,
  QualityAnalysisData,
  DefectAnalysisItem,
  WorkOrderStatusItem,
  DowntimeAnalysisData,
  OeeData,
} from '../types/enterprise';
import { DailyTrendPoint } from '../types/production';

const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

// -------------------------------------------------------------
// Graph 1: Production Output Trend (Line Chart with Daily/Weekly/Monthly)
// -------------------------------------------------------------
export const OutputTrendChart: React.FC<{
  data: DailyTrendPoint[];
  aggregation: 'daily' | 'weekly' | 'monthly';
  onAggregationChange: (agg: 'daily' | 'weekly' | 'monthly') => void;
  loading?: boolean;
}> = ({ data, aggregation, onAggregationChange, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Graph 1: Production Output Trend</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Throughput output vs planned quota over time</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          {(['daily', 'weekly', 'monthly'] as const).map((agg) => (
            <button
              key={agg}
              onClick={() => onAggregationChange(agg)}
              className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                aggregation === agg ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {agg}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Loading trend telemetry...</div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No production trends found for date range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                formatter={(val: any, name: string) => [`${Number(val).toLocaleString()} units`, name === 'produced' ? 'Actual Produced' : 'Planned Target']}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Line name="Planned Target" type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              <Line name="Actual Produced" type="monotone" dataKey="produced" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Graph 2: Production Line Comparison (Bar Chart)
// -------------------------------------------------------------
export const LineComparisonChart: React.FC<{
  data: ProductionByLineItem[];
  loading?: boolean;
}> = ({ data, loading }) => {
  const [selectedLine, setSelectedLine] = useState<string>('ALL');

  const filteredData = selectedLine === 'ALL' ? data : data.filter((d) => String(d.line_id) === selectedLine);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Graph 2: Production Line Comparison</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Actual vs target performance across assembly lines</p>
        </div>

        <select
          value={selectedLine}
          onChange={(e) => setSelectedLine(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Assembly Lines ({data.length})</option>
          {data.map((l) => (
            <option key={l.line_id} value={String(l.line_id)}>
              {l.line_name}
            </option>
          ))}
        </select>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Loading line performance...</div>
        ) : filteredData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No line comparisons available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="line_code" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val: any, name: string) => [`${Number(val).toLocaleString()} units`, name === 'produced_quantity' ? 'Actual Output' : 'Target Quota']}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Bar name="Target Quota" dataKey="target_quantity" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="Actual Output" dataKey="produced_quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Graph 3: Quality Analysis (Donut Chart)
// -------------------------------------------------------------
export const QualityDonutChart: React.FC<{
  data: QualityAnalysisData | null;
  loading?: boolean;
}> = ({ data, loading }) => {
  const chartData = [
    { name: 'Accepted', value: data?.accepted_count || 0, color: '#10b981' },
    { name: 'Rejected', value: data?.rejected_count || 0, color: '#f43f5e' },
    { name: 'Pending Inspection', value: data?.pending_count || 0, color: '#f59e0b' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Graph 3: Quality Analysis</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">End-of-line vehicle quality inspection yield breakdown</p>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px] relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Calculating inspection yield...</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: any) => [`${Number(val).toLocaleString()} units`, 'Inspected']} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xl font-extrabold text-slate-800">{data?.accepted_percentage || 0}%</span>
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Pass Yield</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Graph 4: Defect Analysis (Bar Chart)
// -------------------------------------------------------------
export const DefectBarChart: React.FC<{
  data: DefectAnalysisItem[];
  loading?: boolean;
}> = ({ data, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-slate-900">Graph 4: Manufacturing Defect Analysis</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Frequency distribution across manufacturing defect categories</p>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Loading defect categories...</div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No defect incidents recorded</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="category_name" type="category" tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} tickLine={false} axisLine={false} width={110} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val: any, _name: string, props: any) => [
                  `${val} incidents (${props.payload.percentage}%)`,
                  `Severity: ${props.payload.severity}`,
                ]}
              />
              <Bar dataKey="defect_count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Graph 5: Production Status Distribution (Donut Chart)
// -------------------------------------------------------------
export const WorkOrderStatusChart: React.FC<{
  data: WorkOrderStatusItem[];
  loading?: boolean;
}> = ({ data, loading }) => {
  const statusColors: Record<string, string> = {
    COMPLETED: '#10b981',
    IN_PROGRESS: '#3b82f6',
    PLANNED: '#64748b',
    DELAYED: '#f59e0b',
    CANCELLED: '#f43f5e',
  };

  const chartData = data.map((d) => ({
    name: d.status.replace('_', ' '),
    value: d.count,
    color: statusColors[d.status] || '#94a3b8',
    percentage: d.percentage,
  }));

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Graph 5: Work Order Status Distribution</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Manufacturing batch progress and schedule adherence</p>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px] relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Loading work order statuses...</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val: any, _name: string, props: any) => [`${val} orders (${props.payload.percentage}%)`, 'Status']} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-xl font-extrabold text-slate-800">{total}</span>
              <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Total Orders</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Graph 6: Downtime Analysis (Bar Chart)
// -------------------------------------------------------------
export const DowntimeChart: React.FC<{
  data: DowntimeAnalysisData | null;
  loading?: boolean;
}> = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState<'line' | 'reason'>('line');

  const chartData = viewMode === 'line'
    ? (data?.by_line || []).map((l) => ({ label: l.line_name.replace('Line', '').trim(), minutes: l.total_downtime_minutes }))
    : (data?.top_reasons || []).map((r) => ({ label: r.reason.length > 25 ? r.reason.substring(0, 25) + '...' : r.reason, minutes: r.total_minutes, count: r.incident_count }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Graph 6: Downtime & Stoppage Analysis</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Machine stoppage minutes and recurring root causes</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setViewMode('line')}
            className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'line' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500'}`}
          >
            By Line
          </button>
          <button
            onClick={() => setViewMode('reason')}
            className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'reason' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500'}`}
          >
            By Root Cause
          </button>
        </div>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Aggregating equipment downtime...</div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">Zero downtime events logged</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val: any) => [`${Number(val).toLocaleString()} minutes`, 'Lost Production Time']}
              />
              <Bar dataKey="minutes" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Graph 7: OEE Analysis (Availability × Performance × Quality)
// -------------------------------------------------------------
export const OeeAnalysisCard: React.FC<{
  data: OeeData | null;
  loading?: boolean;
}> = ({ data, loading }) => {
  const oee = data?.oee || 0;
  const availability = data?.availability || 0;
  const performance = data?.performance || 0;
  const quality = data?.quality || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-900">Graph 7: Overall Equipment Effectiveness (OEE)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Calculated: Availability × Performance × Quality</p>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-xs text-slate-400 animate-pulse">Computing real-time OEE metrics...</div>
      ) : (
        <div className="space-y-4 my-auto">
          {/* Main OEE Badge */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-blue-700 tracking-wider">Industrial OEE Score</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{oee}%</div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${oee >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {oee >= 85 ? 'World Class' : oee >= 70 ? 'Operational' : 'Needs Optimization'}
            </div>
          </div>

          {/* Component Bars */}
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Availability (Operating / Planned Time)</span>
                <span>{availability}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${availability}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Performance (Cycle Time × Units / Operating Time)</span>
                <span>{performance}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${performance}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Quality (Good Units / Total Units)</span>
                <span>{quality}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${quality}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Graph 8: Production Target vs Actual vs Variance
// -------------------------------------------------------------
export const TargetVsActualChart: React.FC<{
  data: DailyTrendPoint[];
  loading?: boolean;
}> = ({ data, loading }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Graph 8: Production Target vs Actual Variance</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Shift planned quotas vs actual assembled vehicles</p>
      </div>

      <div className="h-64 w-full flex-1 min-h-[250px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 animate-pulse">Loading variance data...</div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">No variance records available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(-14)} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-25} textAnchor="end" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val: any, name: string) => [`${Number(val).toLocaleString()} units`, name === 'produced' ? 'Actual Output' : name === 'target' ? 'Planned Target' : 'Variance']}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Bar name="Target" dataKey="target" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar name="Actual" dataKey="produced" fill="#2563eb" radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
