import { Router, Request, Response } from 'express';
import { authorize, RequestWithUser } from '../middleware/auth';
import { CreateUserDTO, LoginUserDTO, userService } from '../service/user.service';
import { CustomError } from '../errors/CustomError';

const router = Router();

// POST /users/login
router.post('/login', async (req: Request, res: Response) => {
  const userLogin: LoginUserDTO = req.body;

  try {
    const token = await userService.authenticateUser(userLogin);
    return res.status(200).json({ token });
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// GET /users/:id
router.get('/:id', authorize(), async (req: RequestWithUser, res: Response) => {
  const userId = Number(req.params.id);
  let user = null;

  try {
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    user = await userService.getUser(userId);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  res.status(200).json(user);
});

// POST /users
router.post('/', authorize(), async (req: Request, res: Response) => {
  const user: CreateUserDTO = req.body;

  try {
    await userService.createUser(user);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(201).json({ message: `User ${user.login} created` });
});

// DELETE /users/:id
router.delete('/:id', authorize(), async (req: Request, res: Response) => {
  const userId = Number(req.params.id);

  try {
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    await userService.deleteUser(userId);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(200).json({ message: `User ${userId} deleted` });
});

export default router;
