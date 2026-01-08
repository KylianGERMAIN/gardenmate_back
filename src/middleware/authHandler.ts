import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  login: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  id?: number;
}

type Roles = string[] | undefined;

function normalizeRoles(rolesNeeded?: string[]): Roles {
  return rolesNeeded && rolesNeeded.length > 0 ? rolesNeeded : undefined;
}

function getResourceOwnerId(req: Request): number | undefined {
  const raw = (req.params as Record<string, unknown> | undefined)?.userId ?? req.params?.id;
  return typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : undefined;
}

export const authorize =
  (rolesNeeded?: string[]) => (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Unauthorized' });
    if (!JWT_SECRET) return res.status(500).json({ message: 'JWT secret is not defined' });

    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;
      const roles = normalizeRoles(rolesNeeded);
      const ownerId = getResourceOwnerId(req);

      const hasRole = roles ? roles.includes(decoded.role) : false;
      const isOwner = ownerId !== undefined && decoded.id === ownerId;

      const authorized = roles ? hasRole || isOwner : ownerId === undefined ? true : isOwner;
      if (!authorized) return res.status(403).json({ message: 'Forbidden' });

      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
