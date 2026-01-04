import { z } from 'zod';
import { SunlightLevel } from '../generated/prisma/enums';

export const plantCreateSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  sunlightLevel: z.enum([SunlightLevel.FULL_SUN, SunlightLevel.PARTIAL_SHADE, SunlightLevel.SHADE]),
});
export type PlantCreateBody = z.infer<typeof plantCreateSchema>;

export const plantGetSchema = z.object({
  sunlightLevel: z
    .enum([SunlightLevel.FULL_SUN, SunlightLevel.PARTIAL_SHADE, SunlightLevel.SHADE])
    .optional(),
  name: z.string().optional(),
});
export type PlantGetQuery = z.infer<typeof plantGetSchema>;

export const plantDeleteSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid plant id').transform(Number),
});
export type PlantDeleteParams = z.infer<typeof plantDeleteSchema>;
