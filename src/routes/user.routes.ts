import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/auth';
import { UserParams } from '../interface/user';
import { CreateUserDTO, userService } from '../service/user.service';
import { CustomError } from '../errors/CustomError';

const router = Router();

// GET /users/:id
router.get(
  '/:id',
  authorize(['ADMIN', 'USER']),
  async (req: Request<UserParams>, res: Response) => {
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
  },
);

// POST /users
router.post('/', authorize(['ADMIN']), async (req: Request, res: Response) => {
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
router.delete('/:id', authorize(['ADMIN']), async (req: Request<UserParams>, res: Response) => {
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
