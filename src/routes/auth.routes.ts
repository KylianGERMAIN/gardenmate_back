import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { userService } from '../service/user.service';
import {
  LoginUserBody,
  RefreshTokenBody,
  userLoginSchema,
  userRefreshSchema,
} from '../schemas/user';
import { RequestWithBody } from '../types/express';

const router = Router();

// POST /auth/login
router.post(
  '/login',
  validate(userLoginSchema, 'body'),
  asyncHandler(async (req: RequestWithBody<LoginUserBody>, res: Response) => {
    const tokens = await userService.authenticateUser(req.body);
    res.status(200).json(tokens);
  }),
);

// POST /auth/refresh
router.post(
  '/refresh',
  validate(userRefreshSchema, 'body'),
  asyncHandler(async (req: RequestWithBody<RefreshTokenBody>, res: Response) => {
    const tokens = await userService.refreshTokens(req.body.refreshToken);
    res.status(200).json(tokens);
  }),
);

export default router;
