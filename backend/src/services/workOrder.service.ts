import { workOrderRepository, WorkOrderRepository } from '../repositories/workOrder.repository';
import { WorkOrderDTO } from '../types/enterprise.types';

export class WorkOrderService {
  constructor(private repo: WorkOrderRepository = workOrderRepository) {}

  async getAll(params: {
    plantId?: number;
    lineId?: number;
    status?: string;
    search?: string;
  } = {}): Promise<WorkOrderDTO[]> {
    return this.repo.getAll(params);
  }

  async getById(id: number): Promise<WorkOrderDTO | null> {
    return this.repo.getById(id);
  }

  async create(data: {
    plant_id: number;
    line_id: number;
    model_id: number;
    work_order_number: string;
    planned_quantity: number;
    start_date: string;
    due_date: string;
    status?: string;
  }): Promise<WorkOrderDTO | null> {
    const id = await this.repo.create(data);
    return this.repo.getById(id);
  }

  async update(
    id: number,
    data: Partial<{
      status: string;
      planned_quantity: number;
      due_date: string;
    }>
  ): Promise<WorkOrderDTO | null> {
    const ok = await this.repo.update(id, data);
    if (!ok) return null;
    return this.repo.getById(id);
  }
}

export const workOrderService = new WorkOrderService();
