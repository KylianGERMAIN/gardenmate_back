import { z } from 'zod';

export const userCreateSchema = z.object({
  login: z.string().min(5, 'Login must be at least 5 characters long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['ADMIN', 'USER']),
});
export type CreateUserBody = z.infer<typeof userCreateSchema>;

export const userLoginSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginUserBody = z.infer<typeof userLoginSchema>;

export const userGetSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user id').transform(Number),
});
export type UserGetParams = z.infer<typeof userGetSchema>;

export const plantAssignParamsSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'Invalid user id').transform(Number),
});
export type PlantAssignParams = z.infer<typeof plantAssignParamsSchema>;

export const plantAssignSchema = z.object({
  plantId: z.number().int().positive('Plant ID must be a positive integer'),
  plantedAt: z.string().optional(),
  lastWateredAt: z.string().optional(),
});
export type PlantAssignBody = z.infer<typeof plantAssignSchema>;
