import { z } from 'zod';
import { SunlightLevel } from '../generated/prisma/enums';

export const plantCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Plant name is required')
    .refine((value) => value.trim().length > 0, 'Plant name cannot be empty or whitespace only'),
  sunlightLevel: z.enum([SunlightLevel.FULL_SUN, SunlightLevel.PARTIAL_SHADE, SunlightLevel.SHADE]),
});
export type PlantCreateBody = z.infer<typeof plantCreateSchema>;

export const plantGetSchema = z.object({
  sunlightLevel: z
    .string()
    .optional()
    .refine(
      (value): value is SunlightLevel =>
        Object.values(SunlightLevel).includes(value as SunlightLevel),
      'Invalid sunlight level',
    )
    .transform((value) => value as SunlightLevel),
  name: z.string().optional(),
});
export type PlantGetQuery = z.infer<typeof plantGetSchema>;

export const plantDeleteSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid plant id').transform(Number),
});
export type PlantDeleteParams = z.infer<typeof plantDeleteSchema>;
