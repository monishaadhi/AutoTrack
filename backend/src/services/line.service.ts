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
}

export const lineService = new LineService();
