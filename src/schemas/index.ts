export * from './auth';
export * from './plant';
export * from './user';
export * from './userPlant';

import { userLoginSchema, userRefreshSchema } from './auth';
import { plantCreateSchema, plantDeleteSchema, plantGetSchema } from './plant';
import { userCreateSchema, userGetSchema } from './user';
import {
  plantAssignParamsSchema,
  plantAssignSchema,
  userPlantUidParamsSchema,
  userPlantUpdateSchema,
} from './userPlant';

export const schemas = {
  auth: {
    userLoginSchema,
    userRefreshSchema,
  },
  plant: {
    plantCreateSchema,
    plantGetSchema,
    plantDeleteSchema,
  },
  user: {
    userCreateSchema,
    userGetSchema,
  },
  userPlant: {
    plantAssignParamsSchema,
    plantAssignSchema,
    userPlantUidParamsSchema,
    userPlantUpdateSchema,
  },
} as const;
