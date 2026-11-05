import React, { useEffect, useState, useCallback } from 'react';
import {
  Layers,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { ErrorAlert } from '../components/StateViews';
import { getWorkOrders, createWorkOrder, updateWorkOrder } from '../api/workOrders';
import { getPlants } from '../api/plants';
import { getProductionLines } from '../api/lines';
import { WorkOrder, Plant } from '../types/enterprise';
import { ProductionLine } from '../types/production';
import { useAuth } from '../context/AuthContext';

export const WorkOrders: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrOperator = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plantFilter, setPlantFilter] = useState<number | undefined>(undefined);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    plant_id: 1,
    line_id: 1,
    model_id: 1,
    work_order_number: `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    planned_quantity: 4000,
    start_date: '2026-11-01',
    due_date: '2026-11-15',
    status: 'PLANNED',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [orderList, plantList, lineList] = await Promise.all([
        getWorkOrders({ search, status: statusFilter, plantId: plantFilter }),
        getPlants(),
        getProductionLines(),
      ]);
      setOrders(orderList);
      setPlants(plantList);
      setLines(lineList.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, plantFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);
      await createWorkOrder(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateWorkOrder(orderId, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <TrendingUp className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Delayed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      case 'PLANNED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />
            Planned
          </span>
        );
    }
  };

  const columns: Column<WorkOrder>[] = [
    {
      header: 'Order #',
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-900">{row.work_order_number}</span>
          <div className="text-[11px] text-slate-400">{row.plant_name || 'Assembly Plant'}</div>
        </div>
      ),
    },
    {
      header: 'Vehicle Model',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-xs text-slate-800">{row.model_name || 'Vehicle'}</span>
          <span className="block text-[10px] font-mono text-blue-600">{row.model_code}</span>
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
      header: 'Planned vs Actual',
      accessor: (row) => {
        const completed = row.completed_quantity || 0;
        const planned = row.planned_quantity || 1;
        const pct = Math.min(100, Math.round((completed / planned) * 100));
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
              <span>{completed.toLocaleString()} / {planned.toLocaleString()}</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                style={{ width: `${pct}%` }}
              ></div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Schedule',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <div>Start: <span className="font-medium text-slate-800">{row.start_date}</span></div>
          <div>Due: <span className="font-medium text-slate-800">{row.due_date}</span></div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        isAdminOrOperator ? (
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.work_order_id, e.target.value)}
            className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        ) : (
          <span className="text-xs text-slate-400">View Only</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Manufacturing Work Orders</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automotive vehicle assembly scheduling, batch quotas, and completion tracking
          </p>
        </div>

        {isAdminOrOperator && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search work order # or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-60"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Plant Filter */}
          <select
            value={plantFilter || ''}
            onChange={(e) => setPlantFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="">All Facilities</option>
            {plants.map((p) => (
              <option key={p.plant_id} value={p.plant_id}>
                {p.plant_name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Total Orders: <span className="text-slate-800">{orders.length}</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyTitle="No work orders found"
        emptyDescription="No manufacturing work orders matched your search or status filters."
      />

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create New Vehicle Work Order</h3>

            {formError && <div className="mb-4 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{formError}</div>}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Work Order #</label>
                <input
                  type="text"
                  required
                  value={formData.work_order_number}
                  onChange={(e) => setFormData({ ...formData, work_order_number: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Plant</label>
                  <select
                    value={formData.plant_id}
                    onChange={(e) => setFormData({ ...formData, plant_id: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {plants.map((p) => (
                      <option key={p.plant_id} value={p.plant_id}>
                        {p.plant_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Production Line</label>
                  <select
                    value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {lines.map((l) => (
                      <option key={l.line_id} value={l.line_id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Vehicle Model</label>
                  <select
                    value={formData.model_id}
                    onChange={(e) => setFormData({ ...formData, model_id: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value={1}>Apex CyberSedan S</option>
                    <option value={2}>Titan Electric SUV</option>
                    <option value={3}>Solaria GT Coupe</option>
                    <option value={4}>Vantage Light Truck</option>
                    <option value={5}>Horizon Crossover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Planned Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.planned_quantity}
                    onChange={(e) => setFormData({ ...formData, planned_quantity: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
