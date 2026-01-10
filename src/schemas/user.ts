import { z } from 'zod';
import { utils } from '../utils/utils';

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

export const userRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenBody = z.infer<typeof userRefreshSchema>;

export const userGetSchema = z.object({
  uid: z.string().uuid({ message: 'Invalid user uid' }).transform(utils.normalizeUid),
});
export type UserGetParams = z.infer<typeof userGetSchema>;

export const plantAssignParamsSchema = z.object({
  userUid: z.string().uuid({ message: 'Invalid user uid' }).transform(utils.normalizeUid),
});
export type PlantAssignParams = z.infer<typeof plantAssignParamsSchema>;

export const plantAssignSchema = z.object({
  plantUid: z.string().uuid({ message: 'Invalid plant uid' }).transform(utils.normalizeUid),
  plantedAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .transform((val) => (val ? new Date(val) : undefined)),
  lastWateredAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
    .transform((val) => (val ? new Date(val) : undefined)),
});
export type PlantAssignBody = z.infer<typeof plantAssignSchema>;
