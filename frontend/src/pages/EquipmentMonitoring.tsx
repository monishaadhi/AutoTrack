import React, { useEffect, useState, useCallback } from 'react';
import {
  Cpu,
  Clock,
  AlertTriangle,
  Activity,
  Filter,
  Wrench,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { ErrorAlert } from '../components/StateViews';
import { getEquipment, getDowntimeRecords } from '../api/equipment';
import { getPlants } from '../api/plants';
import { getProductionLines } from '../api/lines';
import { Equipment, DowntimeRecord, Plant } from '../types/enterprise';
import { ProductionLine } from '../types/production';

export const EquipmentMonitoring: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [downtimeList, setDowntimeList] = useState<DowntimeRecord[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>(undefined);
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eqs, dts, pls, lns] = await Promise.all([
        getEquipment({ lineId: selectedLineId, plantId: selectedPlantId, status: statusFilter }),
        getDowntimeRecords({ lineId: selectedLineId, limit: 30 }),
        getPlants(),
        getProductionLines(),
      ]);
      setEquipmentList(eqs);
      setDowntimeList(dts);
      setPlants(pls);
      setLines(lns.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load equipment telemetry');
    } finally {
      setLoading(false);
    }
  }, [selectedPlantId, selectedLineId, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" />
            Maintenance
          </span>
        );
      case 'STOPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Stopped
          </span>
        );
      case 'STANDBY':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Activity className="w-3 h-3 text-slate-500" />
            Standby
          </span>
        );
    }
  };

  const downtimeColumns: Column<DowntimeRecord>[] = [
    {
      header: 'Equipment',
      accessor: (row) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{row.equipment_name || 'Machine Unit'}</div>
          <div className="text-[10px] font-mono text-slate-400">{row.equipment_code}</div>
        </div>
      ),
    },
    {
      header: 'Production Line',
      accessor: (row) => (
        <span className="text-xs text-slate-700 font-medium">{row.line_name || `Line #${row.line_id}`}</span>
      ),
    },
    {
      header: 'Duration',
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <Clock className="w-3 h-3" />
          {row.duration_minutes} min
        </span>
      ),
    },
    {
      header: 'Root Cause & Stoppage Reason',
      accessor: (row) => (
        <div className="text-xs text-slate-800 leading-snug">{row.downtime_reason}</div>
      ),
    },
    {
      header: 'Incident Time',
      accessor: (row) => (
        <div className="text-xs text-slate-500 whitespace-nowrap">{row.downtime_start}</div>
      ),
    },
  ];

  const runningCount = equipmentList.filter((e) => e.status === 'RUNNING').length;
  const maintenanceCount = equipmentList.filter((e) => e.status === 'MAINTENANCE').length;
  const stoppedCount = equipmentList.filter((e) => e.status === 'STOPPED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span>Industrial Equipment Monitoring & Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of robotic weld cells, stamping presses, paint atomizers, and torque spindles
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            {runningCount} Running
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            {maintenanceCount} Maintenance
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            {stoppedCount} Stopped
          </span>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Equipment Grid Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={selectedPlantId || ''}
          onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="">All Assembly Plants</option>
          {plants.map((p) => (
            <option key={p.plant_id} value={p.plant_id}>
              {p.plant_name}
            </option>
          ))}
        </select>

        <select
          value={selectedLineId || ''}
          onChange={(e) => setSelectedLineId(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="">All Production Lines ({lines.length})</option>
          {lines.map((l) => (
            <option key={l.line_id} value={l.line_id}>
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
        >
          <option value="">All Operational Statuses</option>
          <option value="RUNNING">Running</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="STOPPED">Stopped</option>
          <option value="STANDBY">Standby</option>
        </select>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipmentList.map((eq) => (
          <div
            key={eq.equipment_id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {eq.equipment_code}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{eq.equipment_name}</h4>
                <div className="text-[11px] text-slate-400">{eq.equipment_type}</div>
              </div>
              {getStatusBadge(eq.status)}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">{eq.line_name || `Line #${eq.line_id}`}</span>
              <span className="text-slate-400 font-medium">{eq.plant_name || 'Plant'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Downtime Records Audit Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Equipment Downtime Audit Log</h3>
          </div>
          <span className="text-xs text-slate-500">Showing recent stoppage events</span>
        </div>

        <DataTable
          columns={downtimeColumns}
          data={downtimeList}
          loading={loading}
          emptyTitle="No downtime events"
          emptyDescription="No equipment stoppages recorded for this line."
        />
      </div>
    </div>
  );
};
