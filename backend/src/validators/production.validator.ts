import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const shiftEnum = z
  .string()
  .transform((val) => val.toUpperCase())
  .refine(
    (val): val is 'MORNING' | 'EVENING' | 'NIGHT' =>
      ['MORNING', 'EVENING', 'NIGHT'].includes(val),
    {
      message: 'shift must be MORNING, EVENING, or NIGHT (case-insensitive)',
    }
  );

export const getProductionRecordsSchema = z.object({
  query: z.object({
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
    shift: shiftEnum.optional(),
  }),
});

export const getProductionRecordByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: 'Record ID must be a positive integer',
      })
      .transform((val) => Number(val)),
  }),
});

export const createProductionRecordSchema = z.object({
  body: z.object({
    line_id: z
      .number({ required_error: 'line_id is required' })
      .int('line_id must be an integer')
      .positive('line_id must be a positive integer'),
    production_date: z
      .string({ required_error: 'production_date is required' })
      .regex(dateRegex, 'production_date must be in YYYY-MM-DD format'),
    shift: shiftEnum,
    target_quantity: z
      .number({ required_error: 'target_quantity is required' })
      .int('target_quantity must be an integer')
      .nonnegative('target_quantity must be non-negative'),
    produced_quantity: z
      .number({ required_error: 'produced_quantity is required' })
      .int('produced_quantity must be an integer')
      .nonnegative('produced_quantity must be non-negative'),
    defect_count: z
      .number()
      .int('defect_count must be an integer')
      .nonnegative('defect_count must be non-negative')
      .optional()
      .default(0),
    downtime_minutes: z
      .number()
      .int('downtime_minutes must be an integer')
      .nonnegative('downtime_minutes must be non-negative')
      .optional()
      .default(0),
  }),
});

export const updateProductionRecordSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: 'Record ID must be a positive integer',
      })
      .transform((val) => Number(val)),
  }),
  body: z
    .object({
      line_id: z.number().int().positive().optional(),
      production_date: z.string().regex(dateRegex, 'production_date must be in YYYY-MM-DD format').optional(),
      shift: shiftEnum.optional(),
      target_quantity: z.number().int().nonnegative().optional(),
      produced_quantity: z.number().int().nonnegative().optional(),
      defect_count: z.number().int().nonnegative().optional(),
      downtime_minutes: z.number().int().nonnegative().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided to update',
    }),
});
