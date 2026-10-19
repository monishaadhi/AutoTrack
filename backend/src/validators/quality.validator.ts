import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const qualityStatusEnum = z
  .string()
  .transform((val) => val.toUpperCase().replace(/\s+/g, '_'))
  .refine(
    (val): val is 'OPEN' | 'IN_REVIEW' | 'RESOLVED' =>
      ['OPEN', 'IN_REVIEW', 'RESOLVED'].includes(val),
    {
      message: 'status must be OPEN, IN_REVIEW, or RESOLVED',
    }
  );

const qualitySeverityEnum = z
  .string()
  .transform((val) => val.toUpperCase())
  .refine(
    (val): val is 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =>
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(val),
    {
      message: 'severity must be LOW, MEDIUM, HIGH, or CRITICAL',
    }
  );

const qualityCategoryEnum = z
  .string()
  .transform((val) => val.toUpperCase())
  .refine(
    (val): val is 'PAINT' | 'WELD' | 'ASSEMBLY' | 'ELECTRICAL' | 'ALIGNMENT' | 'TRIM' | 'OTHER' =>
      ['PAINT', 'WELD', 'ASSEMBLY', 'ELECTRICAL', 'ALIGNMENT', 'TRIM', 'OTHER'].includes(val),
    {
      message: 'category must be PAINT, WELD, ASSEMBLY, ELECTRICAL, ALIGNMENT, TRIM, or OTHER',
    }
  );

export const getQualityIssuesSchema = z.object({
  query: z.object({
    status: qualityStatusEnum.optional(),
    severity: qualitySeverityEnum.optional(),
    category: qualityCategoryEnum.optional(),
    from: z
      .string()
      .optional()
      .refine((val) => !val || dateRegex.test(val), {
        message: 'from must be in YYYY-MM-DD format',
      }),
    to: z
      .string()
      .optional()
      .refine((val) => !val || dateRegex.test(val), {
        message: 'to must be in YYYY-MM-DD format',
      }),
    startDate: z
      .string()
      .optional()
      .refine((val) => !val || dateRegex.test(val), {
        message: 'startDate must be in YYYY-MM-DD format',
      }),
    endDate: z
      .string()
      .optional()
      .refine((val) => !val || dateRegex.test(val), {
        message: 'endDate must be in YYYY-MM-DD format',
      }),
    lineId: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1), {
        message: 'lineId must be a positive integer',
      })
      .transform((val) => (val ? Number(val) : undefined)),
    page: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1), {
        message: 'page must be a positive integer',
      })
      .transform((val) => (val ? Number(val) : 1)),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 100), {
        message: 'limit must be an integer between 1 and 100',
      })
      .transform((val) => (val ? Number(val) : 10)),
  }),
});

export const getQualityIssueByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: 'Issue ID must be a positive integer',
      })
      .transform((val) => Number(val)),
  }),
});

export const updateQualityIssueStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: 'Issue ID must be a positive integer',
      })
      .transform((val) => Number(val)),
  }),
  body: z.object({
    status: qualityStatusEnum,
  }),
});
