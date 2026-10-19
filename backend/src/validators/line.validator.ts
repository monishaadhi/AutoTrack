import { z } from 'zod';

const lineStatusEnum = z
  .string()
  .transform((val) => val.toUpperCase())
  .refine(
    (val): val is 'RUNNING' | 'STOPPED' | 'MAINTENANCE' =>
      ['RUNNING', 'STOPPED', 'MAINTENANCE'].includes(val),
    {
      message: 'status must be RUNNING, STOPPED, or MAINTENANCE',
    }
  );

export const getLinesSchema = z.object({
  query: z.object({
    factoryId: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1), {
        message: 'factoryId must be a positive integer',
      })
      .transform((val) => (val ? Number(val) : undefined)),
    factory_id: z
      .string()
      .optional()
      .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1), {
        message: 'factory_id must be a positive integer',
      })
      .transform((val) => (val ? Number(val) : undefined)),
    status: lineStatusEnum.optional(),
  }),
});

export const getLineByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
        message: 'Line ID must be a positive integer',
      })
      .transform((val) => Number(val)),
  }),
});
