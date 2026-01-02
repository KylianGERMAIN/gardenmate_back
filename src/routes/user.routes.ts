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

  try {
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await userService.getUser(userId);
    res.status(200).json(user);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// POST /users
router.post('/', async (req: Request, res: Response) => {
  try {
    const user: CreateUserDTO = req.body;
    const createdUser = await userService.createUser(user);
    return res.status(201).json(createdUser);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// DELETE /users/:id
router.delete('/:id', authorize(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  const userId = Number(req.params.id);
  if (Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });

  try {
    const deletedUser = await userService.deleteUser(userId);
    return res.status(200).json(deletedUser);
  } catch (error: unknown) {
    if (error instanceof CustomError) {
      return res.status(error.code).json({ message: error.message });
    } else {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

export default router;
