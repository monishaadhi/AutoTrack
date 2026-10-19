import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'email is required' })
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'password is required' })
      .min(1, 'password cannot be empty'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: 'username is required' })
      .min(3, 'username must be at least 3 characters')
      .max(50, 'username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'username can only contain letters, numbers, underscores, and dashes'),
    email: z
      .string({ required_error: 'email is required' })
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'password is required' })
      .min(6, 'password must be at least 6 characters'),
    role: z
      .enum(['VIEWER', 'OPERATOR'])
      .optional()
      .default('VIEWER'),
    first_name: z.string().max(50).optional(),
    last_name: z.string().max(50).optional(),
  }),
});
