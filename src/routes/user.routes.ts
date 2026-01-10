import { Router, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { userService } from '../service/user.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  CreateUserBody,
  LoginUserBody,
  PlantAssignParams,
  PlantAssignBody,
  plantAssignParamsSchema,
  plantAssignSchema,
  userCreateSchema,
  UserGetParams,
  userGetSchema,
  userLoginSchema,
} from '../schemas/user';
import { validate } from '../middleware/validate';
import { RequestWithParamsAndBody, RequestWithBody, RequestWithParams } from '../types/express';

const router = Router();

// POST /users/login
router.post(
  '/login',
  validate(userLoginSchema, 'body'),
  asyncHandler(async (req: RequestWithBody<LoginUserBody>, res: Response) => {
    const token = await userService.authenticateUser(req.body);
    res.status(200).json({ token });
  }),
);

// GET /users/:uid
router.get(
  '/:uid',
  authorize(),
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

export default router;
