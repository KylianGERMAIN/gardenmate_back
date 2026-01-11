import { z } from 'zod';
import { utils } from '../utils/utils';

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

export const userPlantUidParamsSchema = z.object({
  userUid: z.string().uuid({ message: 'Invalid user uid' }).transform(utils.normalizeUid),
  uid: z.string().uuid({ message: 'Invalid userPlant uid' }).transform(utils.normalizeUid),
});
export type UserPlantUidParams = z.infer<typeof userPlantUidParamsSchema>;

const optionalDateOrNullSchema = z
  .union([
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    z.null(),
  ])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    return new Date(val);
  });

export const userPlantUpdateSchema = z
  .object({
    plantedAt: optionalDateOrNullSchema,
    lastWateredAt: optionalDateOrNullSchema,
  })
  .refine((body) => body.plantedAt !== undefined || body.lastWateredAt !== undefined, {
    message: 'At least one field (plantedAt, lastWateredAt) must be provided',
  });
export type UserPlantUpdateBody = z.infer<typeof userPlantUpdateSchema>;
