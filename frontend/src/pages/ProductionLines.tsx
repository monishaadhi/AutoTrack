import React, { useEffect, useState, useCallback } from 'react';
import { Cpu, MapPin, Building2, Activity, Filter } from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { ErrorAlert, LoadingSpinner } from '../components/StateViews';
import { getProductionLines } from '../api/lines';
import { ProductionLine, LineStatus } from '../types/production';

export const ProductionLines: React.FC = () => {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadLines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProductionLines({
        status: statusFilter || undefined,
      });
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setLines(list);
    } catch (err) {
      setError((err as Error).message || 'Failed to load production lines');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const getStatusBadge = (status: LineStatus) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Maintenance
          </span>
        );
      case 'STOPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Stopped
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const columns: Column<ProductionLine>[] = [
    {
      header: 'Line ID',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          LINE-{String(row.line_id).padStart(2, '0')}
        </span>
      ),
    },
    {
      header: 'Line Name',
      accessor: (row) => (
        <div className="font-medium text-slate-900">{row.name}</div>
      ),
    },
    {
      header: 'Factory',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.factory_name}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span>{row.factory_location}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Configured On',
      accessor: (row) => (
        <span className="text-xs text-slate-500">{row.created_at || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Production Lines</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status and factory distribution across manufacturing facilities
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="STOPPED">Stopped</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadLines} />}

      {/* Cards View of Lines */}
      {!loading && lines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lines.map((line) => (
            <div
              key={line.line_id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {line.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        LINE-{String(line.line_id).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(line.status)}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Factory:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">
                      {line.factory_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-slate-700">{line.factory_location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  Telemetry Active
                </span>
                <span>Active Line</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Table */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Line Registry</h3>
        <DataTable
          columns={columns}
          data={lines}
          loading={loading}
          emptyTitle="No production lines found"
          emptyDescription="No manufacturing lines match the selected status filter."
        />
      </div>

      {loading && lines.length === 0 && <LoadingSpinner message="Loading production lines..." />}
    </div>
  );
};
