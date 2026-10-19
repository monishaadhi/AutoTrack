import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable';
import { DateFilter } from '../components/DateFilter';
import { ErrorAlert, LoadingSpinner } from '../components/StateViews';
import {
  getProductionRecords,
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecord,
} from '../api/production';
import { getProductionLines } from '../api/lines';
import { ProductionRecord, ProductionLine, ShiftType } from '../types/production';
import { useAuth } from '../context/AuthContext';

interface FormState {
  line_id: number;
  production_date: string;
  shift: ShiftType;
  target_quantity: number;
  produced_quantity: number;
  defect_count: number;
  downtime_minutes: number;
}

const defaultFormState: FormState = {
  line_id: 1,
  production_date: new Date().toISOString().split('T')[0],
  shift: 'MORNING',
  target_quantity: 400,
  produced_quantity: 380,
  defect_count: 5,
  downtime_minutes: 10,
};

export const Production: React.FC = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['ADMIN', 'OPERATOR']);
  const canEdit = hasRole(['ADMIN', 'OPERATOR']);
  const canDelete = hasRole(['ADMIN']);

  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lineId, setLineId] = useState<string>('');
  const [shift, setShift] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal State for Delete Confirmation
  const [recordToDelete, setRecordToDelete] = useState<ProductionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load line choices for dropdown
  useEffect(() => {
    getProductionLines()
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setLines(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, line_id: list[0].line_id }));
        }
      })
      .catch(() => {});
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProductionRecords({
        page,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        lineId: lineId ? Number(lineId) : undefined,
        shift: shift || undefined,
      });

      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setRecords(list);
      setTotalPages(res?.pagination?.totalPages || 1);
      setTotalRecords(res?.pagination?.total ?? list.length);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch production records');
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, lineId, shift]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setLineId('');
    setShift('');
    setPage(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingRecord(null);
    setFormData({
      line_id: lines[0]?.line_id || 1,
      production_date: new Date().toISOString().split('T')[0],
      shift: 'MORNING',
      target_quantity: 400,
      produced_quantity: 380,
      defect_count: 5,
      downtime_minutes: 10,
    });
    setFormErrors({});
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (record: ProductionRecord) => {
    setModalMode('edit');
    setEditingRecord(record);
    setFormData({
      line_id: record.line_id,
      production_date: record.production_date,
      shift: record.shift,
      target_quantity: record.target_quantity,
      produced_quantity: record.produced_quantity,
      defect_count: record.defect_count,
      downtime_minutes: record.downtime_minutes,
    });
    setFormErrors({});
    setModalError(null);
    setIsModalOpen(true);
  };

  // Form Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.line_id || formData.line_id <= 0) {
      errors.line_id = 'Please select a production line';
    }
    if (!formData.production_date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.production_date)) {
      errors.production_date = 'Production date must be in YYYY-MM-DD format';
    }
    if (!formData.shift) {
      errors.shift = 'Shift is required';
    }
    if (formData.target_quantity === undefined || formData.target_quantity < 0 || isNaN(formData.target_quantity)) {
      errors.target_quantity = 'Target quantity must be 0 or greater';
    }
    if (formData.produced_quantity === undefined || formData.produced_quantity < 0 || isNaN(formData.produced_quantity)) {
      errors.produced_quantity = 'Produced quantity must be 0 or greater';
    }
    if (formData.defect_count === undefined || formData.defect_count < 0 || isNaN(formData.defect_count)) {
      errors.defect_count = 'Defect count must be 0 or greater';
    }
    if (formData.downtime_minutes === undefined || formData.downtime_minutes < 0 || isNaN(formData.downtime_minutes)) {
      errors.downtime_minutes = 'Downtime minutes must be 0 or greater';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setModalError(null);

      if (modalMode === 'create') {
        const created = await createProductionRecord(formData);
        setSuccessMessage(`Production record #${created.record_id} created successfully.`);
      } else if (modalMode === 'edit' && editingRecord) {
        await updateProductionRecord(editingRecord.record_id, formData);
        setSuccessMessage(`Production record #${editingRecord.record_id} updated successfully.`);
      }

      setIsModalOpen(false);
      await loadRecords();
    } catch (err) {
      setModalError((err as Error).message || 'Failed to save production record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and Execute Deletion
  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteProductionRecord(recordToDelete.record_id);
      setSuccessMessage(`Production record #${recordToDelete.record_id} deleted successfully.`);
      setRecordToDelete(null);
      await loadRecords();
    } catch (err) {
      setDeleteError((err as Error).message || 'Failed to delete production record');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ProductionRecord>[] = [
    {
      header: 'Date',
      accessor: (row) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {row.production_date}
        </span>
      ),
    },
    {
      header: 'Line',
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.line_name || `Line #${row.line_id}`}</div>
          <div className="text-[11px] text-slate-400">{row.factory_name}</div>
        </div>
      ),
    },
    {
      header: 'Shift',
      accessor: (row) => {
        const colors: Record<string, string> = {
          MORNING: 'bg-amber-50 text-amber-700 border-amber-200',
          EVENING: 'bg-blue-50 text-blue-700 border-blue-200',
          NIGHT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
        return (
          <span
            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
              colors[row.shift] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {row.shift}
          </span>
        );
      },
    },
    {
      header: 'Target',
      accessor: (row) => Number(row.target_quantity ?? 0).toLocaleString(),
      className: 'text-right',
    },
    {
      header: 'Produced',
      accessor: (row) => (
        <span className="font-semibold text-slate-900">
          {Number(row.produced_quantity ?? 0).toLocaleString()}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Defects',
      accessor: (row) => (
        <span
          className={
            row.defect_count > 10
              ? 'text-rose-600 font-semibold'
              : row.defect_count > 0
              ? 'text-amber-600'
              : 'text-slate-500'
          }
        >
          {row.defect_count}
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Downtime',
      accessor: (row) => (
        <span className={row.downtime_minutes > 30 ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
          {row.downtime_minutes}m
        </span>
      ),
      className: 'text-right',
    },
    {
      header: 'Achievement',
      accessor: (row) => {
        const rate =
          row.achievement_rate !== undefined
            ? Number(row.achievement_rate)
            : (Number(row.produced_quantity) / (Number(row.target_quantity) || 1)) * 100;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <span
              className={`font-semibold ${
                rate >= 90 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {rate.toFixed(1)}%
            </span>
          </div>
        );
      },
      className: 'text-right',
    },
    {
      header: 'Actions',
      accessor: (row) => {
        if (!canEdit && !canDelete) {
          return (
            <span className="text-[11px] font-medium text-slate-400 italic">
              Read-only
            </span>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canEdit && (
              <button
                onClick={() => handleOpenEditModal(row)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={`Edit Record #${row.record_id}`}
                aria-label={`Edit Record #${row.record_id}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  setDeleteError(null);
                  setRecordToDelete(row);
                }}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title={`Delete Record #${row.record_id}`}
                aria-label={`Delete Record #${row.record_id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Production Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift throughput logs, planned quotas, and defect records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            onEndDateChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            onReset={handleResetFilters}
          />

          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">Filters:</span>
        </div>

        {/* Line filter */}
        <select
          value={lineId}
          onChange={(e) => {
            setLineId(e.target.value);
            setPage(1);
          }}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Lines</option>
          {lines.map((l) => (
            <option key={l.line_id} value={l.line_id}>
              {l.name}
            </option>
          ))}
        </select>

        {/* Shift filter */}
        <select
          value={shift}
          onChange={(e) => {
            setShift(e.target.value);
            setPage(1);
          }}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Shifts</option>
          <option value="MORNING">Morning Shift</option>
          <option value="EVENING">Evening Shift</option>
          <option value="NIGHT">Night Shift</option>
        </select>

        <span className="ml-auto text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{records.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalRecords}</span> entries
        </span>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadRecords} />}

      {/* Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyTitle="No production records found"
        emptyDescription="Try clearing filters or selecting another date range, or log a new shift record."
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

      {loading && records.length === 0 && (
        <LoadingSpinner message="Fetching production shift records..." />
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'create' ? 'Log Production Record' : `Edit Record #${editingRecord?.record_id}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalMode === 'create'
                    ? 'Log newly assembled output, quotas, and shift telemetry'
                    : 'Update existing shift quantities and operational metrics'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Line Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Production Line</label>
                  <select
                    value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: Number(e.target.value) })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.line_id ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  >
                    {lines.map((l) => (
                      <option key={l.line_id} value={l.line_id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.line_id && <p className="text-[11px] text-rose-600">{formErrors.line_id}</p>}
                </div>

                {/* Shift Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as ShiftType })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.shift ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="NIGHT">Night Shift</option>
                  </select>
                  {formErrors.shift && <p className="text-[11px] text-rose-600">{formErrors.shift}</p>}
                </div>

                {/* Date Input */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Production Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formData.production_date}
                    onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.production_date ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.production_date && (
                    <p className="text-[11px] text-rose-600">{formErrors.production_date}</p>
                  )}
                </div>

                {/* Target Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.target_quantity}
                    onChange={(e) => setFormData({ ...formData, target_quantity: Number(e.target.value) })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.target_quantity ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.target_quantity && (
                    <p className="text-[11px] text-rose-600">{formErrors.target_quantity}</p>
                  )}
                </div>

                {/* Produced Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Produced Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.produced_quantity}
                    onChange={(e) => setFormData({ ...formData, produced_quantity: Number(e.target.value) })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.produced_quantity ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.produced_quantity && (
                    <p className="text-[11px] text-rose-600">{formErrors.produced_quantity}</p>
                  )}
                </div>

                {/* Defect Count */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Defect Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defect_count}
                    onChange={(e) => setFormData({ ...formData, defect_count: Number(e.target.value) })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.defect_count ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.defect_count && (
                    <p className="text-[11px] text-rose-600">{formErrors.defect_count}</p>
                  )}
                </div>

                {/* Downtime Minutes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Downtime (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.downtime_minutes}
                    onChange={(e) => setFormData({ ...formData, downtime_minutes: Number(e.target.value) })}
                    className={`w-full text-xs font-medium text-slate-800 bg-slate-50 border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                      formErrors.downtime_minutes ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.downtime_minutes && (
                    <p className="text-[11px] text-rose-600">{formErrors.downtime_minutes}</p>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{modalMode === 'create' ? 'Save Record' : 'Update Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Production Record</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete production record{' '}
                <strong className="text-slate-800 font-mono">#{recordToDelete.record_id}</strong> for{' '}
                <strong className="text-slate-800">{recordToDelete.line_name || `Line #${recordToDelete.line_id}`}</strong>{' '}
                on <span className="font-mono">{recordToDelete.production_date}</span> ({recordToDelete.shift})?
              </p>

              {deleteError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRecord}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isDeleting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
