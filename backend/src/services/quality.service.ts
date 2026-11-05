import {
  qualityRepository,
  QualityRepository,
} from '../repositories/quality.repository';
import {
  QualityIssueRow,
  QualityFilterParams,
  QualityStatus,
} from '../types/quality.types';
import { ServiceError } from './production.service';
import { PaginatedResponse } from '../types/production.types';

export class QualityService {
  constructor(private repo: QualityRepository = qualityRepository) {}

  async getIssues(
    filters: QualityFilterParams = {}
  ): Promise<PaginatedResponse<QualityIssueRow>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));

    const { rows, total } = await this.repo.findMany(filters);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getIssueById(id: number): Promise<QualityIssueRow> {
    const issue = await this.repo.findById(id);
    if (!issue) {
      throw new ServiceError(`Quality issue #${id} not found`, 404);
    }
    return issue;
  }

  async createIssue(data: {
    record_id: number;
    defect_category_id?: number;
    category?: string;
    severity?: string;
    status?: string;
    description: string;
  }): Promise<QualityIssueRow> {
    const insertId = await this.repo.create(data);
    const created = await this.repo.findById(insertId);
    if (!created) {
      throw new ServiceError('Failed to retrieve newly created quality issue', 500);
    }
    return created;
  }

  async updateIssue(
    id: number,
    data: Partial<{
      category: string;
      severity: string;
      status: string;
      description: string;
    }>
  ): Promise<QualityIssueRow> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ServiceError(`Quality issue #${id} not found`, 404);
    }
    await this.repo.update(id, data);
    return (await this.repo.findById(id))!;
  }

  async updateIssueStatus(id: number, status: QualityStatus): Promise<QualityIssueRow> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ServiceError(`Quality issue #${id} not found`, 404);
    }

    await this.repo.updateStatus(id, status);

    const updated = await this.repo.findById(id);
    if (!updated) {
      throw new ServiceError('Failed to retrieve updated quality issue', 500);
    }
    return updated;
  }
}

export const qualityService = new QualityService();
