import { Router, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { userService } from '../service/user.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  CreateUserBody,
  PlantAssignParams,
  PlantAssignBody,
  plantAssignParamsSchema,
  plantAssignSchema,
  UserPlantUidParams,
  userPlantUidParamsSchema,
  UserPlantUpdateBody,
  userPlantUpdateSchema,
  userCreateSchema,
  UserGetParams,
  userGetSchema,
} from '../schemas/user';
import { validate } from '../middleware/validate';
import { RequestWithParamsAndBody, RequestWithBody, RequestWithParams } from '../types/express';

const router = Router();
// GET /users/:uid
router.get(
  '/:uid',
  authorize(['ADMIN']),
  validate(userGetSchema, 'params'),
  asyncHandler(async (req: RequestWithParams<UserGetParams>, res: Response) => {
    const user = await userService.getUser(req.params.uid);
    res.status(200).json(user);
  }),
);

// POST /users
router.post(
  '/',
  validate(userCreateSchema, 'body'),
  asyncHandler(async (req: RequestWithBody<CreateUserBody>, res: Response) => {
    const createdUser = await userService.createUser(req.body);
    res.status(201).json(createdUser);
  }),
);

// DELETE /users/:uid
router.delete(
  '/:uid',
  authorize(['ADMIN']),
  validate(userGetSchema, 'params'),
  asyncHandler(async (req: RequestWithParams<UserGetParams>, res: Response) => {
    const deletedUser = await userService.deleteUser(req.params.uid);
    res.status(200).json(deletedUser);
  }),
);

// POST /users/:userUid/plants
router.post(
  '/:userUid/plants',
  authorize(),
  validate(plantAssignParamsSchema, 'params'),
  validate(plantAssignSchema, 'body'),
  asyncHandler(
    async (req: RequestWithParamsAndBody<PlantAssignParams, PlantAssignBody>, res: Response) => {
      const createdUserPlant = await userService.assignPlantToUser({
        userUid: req.params.userUid,
        plantUid: req.body.plantUid,
        plantedAt: req.body.plantedAt,
        lastWateredAt: req.body.lastWateredAt,
      });
      res.status(201).json(createdUserPlant);
    },
  ),
);

// GET /users/:userUid/plants
router.get(
  '/:userUid/plants',
  authorize(),
  validate(plantAssignParamsSchema, 'params'),
  asyncHandler(async (req: RequestWithParams<PlantAssignParams>, res: Response) => {
    const userPlants = await userService.listUserPlants(req.params.userUid);
    res.status(200).json(userPlants);
  }),
);

// PATCH /users/:userUid/plants/:uid
router.patch(
  '/:userUid/plants/:uid',
  authorize(),
  validate(userPlantUidParamsSchema, 'params'),
  validate(userPlantUpdateSchema, 'body'),
  asyncHandler(
    async (
      req: RequestWithParamsAndBody<UserPlantUidParams, UserPlantUpdateBody>,
      res: Response,
    ) => {
      const updated = await userService.updateUserPlant({
        userUid: req.params.userUid,
        userPlantUid: req.params.uid,
        plantedAt: req.body.plantedAt,
        lastWateredAt: req.body.lastWateredAt,
      });
      res.status(200).json(updated);
    },
  ),
);

// DELETE /users/:userUid/plants/:uid
router.delete(
  '/:userUid/plants/:uid',
  authorize(),
  validate(userPlantUidParamsSchema, 'params'),
  asyncHandler(async (req: RequestWithParams<UserPlantUidParams>, res: Response) => {
    const deleted = await userService.deleteUserPlant({
      userUid: req.params.userUid,
      userPlantUid: req.params.uid,
    });
    res.status(200).json(deleted);
  }),
);

export default router;
