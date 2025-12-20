import { Router, Request, Response } from 'express';
import { authorize } from '../middleware/auth';
import { UserParams } from '../interface/user';

const router = Router();

// GET /users/:id
router.get('/:id', authorize(['ADMIN']), (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;
  res.status(200).json({ message: `User ${id} found` });
});

// POST /users
router.post('/', authorize(['ADMIN']), (req: Request, res: Response) => {
  const user = req.body;
  res.status(201).json({ message: 'User created', user });
});

// DELETE /users/:id
router.delete('/:id', authorize(['ADMIN']), (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;
  res.status(200).json({ message: `User ${id} deleted` });
});

export default router;
