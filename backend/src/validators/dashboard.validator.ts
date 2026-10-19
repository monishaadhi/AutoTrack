import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const getDashboardSummarySchema = z.object({
  query: z.object({
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
  }),
});

export const getDashboardTrendsSchema = z
  .object({
    query: z.object({
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
    }),
  })
  .refine(
    (data) => {
      const fromDate = data.query.from || data.query.startDate;
      const toDate = data.query.to || data.query.endDate;
      if (fromDate && toDate) {
        return fromDate <= toDate;
      }
      return true;
    },
    {
      message: 'from date must be less than or equal to to date',
      path: ['query', 'from'],
    }
  );
