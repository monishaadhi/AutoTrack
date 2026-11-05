import { lineRepository, LineRepository } from '../repositories/line.repository';
import { ProductionLineRow, LineFilterParams } from '../types/line.types';
import { ServiceError } from './production.service';

export class LineService {
  constructor(private repo: LineRepository = lineRepository) {}

  async getLines(filters: LineFilterParams = {}): Promise<ProductionLineRow[]> {
    return this.repo.findMany(filters);
  }

  async getLineById(id: number): Promise<ProductionLineRow> {
    const line = await this.repo.findById(id);
    if (!line) {
      throw new ServiceError(`Production line #${id} not found`, 404);
    }
    return line;
  }

  async createLine(data: {
    factory_id: number;
    name: string;
    line_code?: string;
    status?: string;
    production_capacity?: number;
  }): Promise<ProductionLineRow> {
    const insertId = await this.repo.create(data);
    const created = await this.repo.findById(insertId);
    if (!created) {
      throw new ServiceError('Failed to retrieve newly created line', 500);
    }
    return created;
  }

  async updateLine(
    id: number,
    data: Partial<{
      name: string;
      status: string;
      production_capacity: number;
      factory_id: number;
    }>
  ): Promise<ProductionLineRow> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ServiceError(`Production line #${id} not found`, 404);
    }
    const updated = await this.repo.update(id, data);
    if (!updated) {
      return existing;
    }
    return (await this.repo.findById(id))!;
  }

  async deleteLine(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ServiceError(`Production line #${id} not found`, 404);
    }
    try {
      await this.repo.delete(id);
    } catch (err: any) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ServiceError('Cannot delete production line with existing production history', 400);
      }
      throw err;
    }
  }
}

export const lineService = new LineService();
