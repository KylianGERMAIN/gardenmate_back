import { z } from 'zod';

export const userLoginSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginUserBody = z.infer<typeof userLoginSchema>;

export const userRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenBody = z.infer<typeof userRefreshSchema>;
