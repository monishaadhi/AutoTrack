import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { LineChart as LineIcon, BarChart3 } from 'lucide-react';

export interface ProductionChartDataPoint {
  label: string;
  target: number;
  produced: number;
  defects?: number;
}

interface ProductionChartProps {
  title: string;
  subtitle?: string;
  data: ProductionChartDataPoint[];
  loading?: boolean;
  defaultChartType?: 'line' | 'bar';
}

export const ProductionChart: React.FC<ProductionChartProps> = ({
  title,
  subtitle = 'Daily throughput trends against planned manufacturing quotas',
  data,
  loading = false,
  defaultChartType = 'line',
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>(defaultChartType);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-64 mb-6"></div>
        <div className="h-72 bg-slate-50 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Toggle between Line and Bar Chart */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'line'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Line View"
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Line</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              chartType === 'bar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Bar View"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar</span>
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        {(() => {
          const safeData = Array.isArray(data)
            ? data
            : data && typeof data === 'object' && Array.isArray((data as any).data)
            ? (data as any).data
            : [];

          if (safeData.length === 0) {
            return (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No production trend data available for this range
              </div>
            );
          }

          return (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart
                  data={safeData}
                  margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    padding={{ left: 40, right: 40 }}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                    formatter={(value: any, name: string) => [
                      `${Number(value || 0).toLocaleString()} units`,
                      name === 'produced'
                        ? 'Actual Produced'
                        : name === 'target'
                        ? 'Planned Target'
                        : name,
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    iconType="plainline"
                  />
                  <Line
                    name="Planned Target"
                    type="monotone"
                    dataKey="target"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={{ r: 5, fill: '#94a3b8', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    name="Actual Produced"
                    type="monotone"
                    dataKey="produced"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={safeData}
                  margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    padding={{ left: 30, right: 30 }}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                    formatter={(value: any, name: string) => [
                      `${Number(value || 0).toLocaleString()} units`,
                      name === 'produced' ? 'Actual Produced' : 'Planned Target',
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Bar
                    name="Planned Target"
                    dataKey="target"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                  <Bar
                    name="Actual Produced"
                    dataKey="produced"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          );
        })()}
      </div>
    </div>
  );
};
