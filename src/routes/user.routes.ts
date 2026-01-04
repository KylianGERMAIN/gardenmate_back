import { Router, Request, Response } from 'express';
import { authorize, RequestWithUser } from '../middleware/authHandler';
import { CreateUserDTO, LoginUserDTO, userService } from '../service/user.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { CustomError } from '../errors/CustomError';

const router = Router();

// POST /users/login
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const userLogin: LoginUserDTO = req.body;

    const token = await userService.authenticateUser(userLogin);
    res.status(200).json({ token });
  }),
);

// GET /users/:id
router.get(
  '/:id',
  authorize(),
  asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) throw new CustomError('Invalid user id', 400);
    const user = await userService.getUser(userId);
    res.status(200).json(user);
  }),
);

// POST /users
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user: CreateUserDTO = req.body;
    const createdUser = await userService.createUser(user);
    res.status(201).json(createdUser);
  }),
);

// DELETE /users/:id
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) throw new CustomError('Invalid user id', 400);

    const deletedUser = await userService.deleteUser(userId);
    res.status(200).json(deletedUser);
  }),
);

export default router;
