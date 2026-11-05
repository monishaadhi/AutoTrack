import { equipmentRepository, EquipmentRepository } from '../repositories/equipment.repository';
import { EquipmentDTO, DowntimeRecordDTO } from '../types/enterprise.types';

export class EquipmentService {
  constructor(private repo: EquipmentRepository = equipmentRepository) {}

  async getAllEquipment(params: {
    lineId?: number;
    plantId?: number;
    status?: string;
  } = {}): Promise<EquipmentDTO[]> {
    return this.repo.getAllEquipment(params);
  }

  async getDowntimeRecords(params: {
    equipmentId?: number;
    lineId?: number;
    from?: string;
    to?: string;
    limit?: number;
  } = {}): Promise<DowntimeRecordDTO[]> {
    return this.repo.getDowntimeRecords(params);
  }

  async getDowntimeById(id: number): Promise<DowntimeRecordDTO | null> {
    return this.repo.getDowntimeById(id);
  }

  async createDowntime(data: {
    equipment_id: number;
    production_id?: number;
    line_id?: number;
    downtime_start: string;
    downtime_end?: string;
    duration_minutes: number;
    downtime_reason: string;
  }): Promise<DowntimeRecordDTO> {
    if (!data.equipment_id) {
      throw new Error('equipment_id is required');
    }
    if (!data.downtime_start) {
      throw new Error('downtime_start is required');
    }
    if (!data.downtime_reason) {
      throw new Error('downtime_reason is required');
    }
    return this.repo.createDowntime(data);
  }

  async updateDowntime(
    id: number,
    data: {
      equipment_id?: number;
      production_id?: number;
      downtime_start?: string;
      downtime_end?: string;
      duration_minutes?: number;
      downtime_reason?: string;
    }
  ): Promise<DowntimeRecordDTO | null> {
    return this.repo.updateDowntime(id, data);
  }
}

export const equipmentService = new EquipmentService();
