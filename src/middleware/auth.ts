import { Request, Response, NextFunction } from 'express';
import { UserParams } from '../interface/user';

export const authorize = (roles: string[]) => {
  return (req: Request<UserParams>, res: Response, next: NextFunction) => {
    const role = req.headers['x-role'];
    if (!role || !roles.includes(role as string)) {
      return res.status(403).json({ message: 'You are not authorized' });
    }
    next();
  };
};
