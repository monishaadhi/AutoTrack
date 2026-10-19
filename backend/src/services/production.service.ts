import {
  productionRepository,
  ProductionRepository,
} from '../repositories/production.repository';
import {
  calculateAchievementRate,
  calculateScrapRate,
  calculateYieldRate,
} from '../utils/calculations';
import {
  ProductionRecordRow,
  ProductionRecordDTO,
  CreateProductionRecordInput,
  UpdateProductionRecordInput,
  ProductionFilterParams,
  PaginatedResponse,
} from '../types/production.types';

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ServiceError';
  }
}

export class ProductionService {
  constructor(private repo: ProductionRepository = productionRepository) {}

  /**
   * Enriches raw row data with computed manufacturing rates.
   */
  private enrichRecord(row: ProductionRecordRow): ProductionRecordDTO {
    const achievement_rate = calculateAchievementRate(
      row.produced_quantity,
      row.target_quantity
    );
    const scrap_rate = calculateScrapRate(
      row.produced_quantity,
      row.defect_count
    );
    const yield_rate = calculateYieldRate(
      row.produced_quantity,
      row.defect_count
    );

    return {
      ...row,
      achievement_rate,
      scrap_rate,
      yield_rate,
    };
  }

  /**
   * Retrieves paginated production records.
   */
  async getRecords(
    filters: ProductionFilterParams
  ): Promise<PaginatedResponse<ProductionRecordDTO>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));

    const { rows, total } = await this.repo.findMany(filters);
    const data = rows.map((row) => this.enrichRecord(row));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves a single production record by ID.
   */
  async getRecordById(id: number): Promise<ProductionRecordDTO> {
    const record = await this.repo.findById(id);
    if (!record) {
      throw new ServiceError(`Production record #${id} not found`, 404);
    }
    return this.enrichRecord(record);
  }

  /**
   * Creates a new production record.
   */
  async createRecord(
    input: CreateProductionRecordInput
  ): Promise<ProductionRecordDTO> {
    // 1. Verify production line exists
    const lineExists = await this.repo.lineExists(input.line_id);
    if (!lineExists) {
      throw new ServiceError(
        `Production line with ID ${input.line_id} does not exist`,
        400
      );
    }

    // 2. Check unique constraint for line/date/shift
    const existing = await this.repo.findByLineDateShift(
      input.line_id,
      input.production_date,
      input.shift
    );
    if (existing) {
      throw new ServiceError(
        `A production record for line #${input.line_id} on ${input.production_date} (${input.shift} shift) already exists`,
        409
      );
    }

    // 3. Insert record
    const insertId = await this.repo.create(input);
    const created = await this.repo.findById(insertId);
    if (!created) {
      throw new ServiceError('Failed to retrieve newly created record', 500);
    }

    return this.enrichRecord(created);
  }

  /**
   * Updates an existing production record.
   */
  async updateRecord(
    id: number,
    input: UpdateProductionRecordInput
  ): Promise<ProductionRecordDTO> {
    // 1. Verify record exists
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ServiceError(`Production record #${id} not found`, 404);
    }

    // 2. If line_id changed, verify line exists
    const targetLineId = input.line_id ?? existing.line_id;
    if (input.line_id !== undefined && input.line_id !== existing.line_id) {
      const lineExists = await this.repo.lineExists(targetLineId);
      if (!lineExists) {
        throw new ServiceError(
          `Production line with ID ${targetLineId} does not exist`,
          400
        );
      }
    }

    // 3. If line, date, or shift changed, verify no unique constraint collision
    const targetDate = input.production_date ?? existing.production_date;
    const targetShift = input.shift ?? existing.shift;

    const conflict = await this.repo.findByLineDateShift(
      targetLineId,
      targetDate,
      targetShift,
      id
    );
    if (conflict) {
      throw new ServiceError(
        `A production record for line #${targetLineId} on ${targetDate} (${targetShift} shift) already exists`,
        409
      );
    }

    // 4. Update
    await this.repo.update(id, input);

    // 5. Return updated record
    const updated = await this.repo.findById(id);
    if (!updated) {
      throw new ServiceError('Failed to retrieve updated record', 500);
    }

    return this.enrichRecord(updated);
  }

  /**
   * Deletes a production record, adhering to foreign-key rules for related quality issues.
   */
  async deleteRecord(id: number): Promise<{ success: boolean; message: string; deletedId: number }> {
    // 1. Verify record exists
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new ServiceError(`Production record #${id} not found`, 404);
    }

    // 2. Check for related quality issues (foreign key RESTRICT rule)
    const issueCount = await this.repo.countQualityIssuesByRecordId(id);
    if (issueCount > 0) {
      throw new ServiceError(
        `Cannot delete production record #${id} because it has ${issueCount} associated quality issue(s). Resolve or reassign the quality issues first.`,
        409
      );
    }

    // 3. Perform deletion
    await this.repo.delete(id);

    return {
      success: true,
      message: `Production record #${id} deleted successfully`,
      deletedId: id,
    };
  }
}

export const productionService = new ProductionService();
