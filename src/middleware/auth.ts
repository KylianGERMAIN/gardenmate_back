import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  login: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export const authorize =
  (rolesNeeded?: string[]) => (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret is not defined' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      if (rolesNeeded && !rolesNeeded.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = decoded;

      next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
