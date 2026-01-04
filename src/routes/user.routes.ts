import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/authHandler';
import { userService } from '../service/user.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { userCreateSchema, userGetSchema, userLoginSchema } from '../schemas/user';
import { validate } from '../middleware/validate';

const router = Router();

// POST /users/login
router.post(
  '/login',
  validate(userLoginSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const token = await userService.authenticateUser(req.body);
    res.status(200).json({ token });
  }),
);

// GET /users/:id
router.get(
  '/:id',
  authorize(),
  validate(userGetSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUser(Number(req.params.id));
    res.status(200).json(user);
  }),
);

// POST /users
router.post(
  '/',
  validate(userCreateSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const createdUser = await userService.createUser(req.body);
    res.status(201).json(createdUser);
  }),
);

// DELETE /users/:id
router.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(userGetSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const deletedUser = await userService.deleteUser(Number(req.params.id));
    res.status(200).json(deletedUser);
  }),
);

export default router;
