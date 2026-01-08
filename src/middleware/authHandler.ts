import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  uid: string;
  login: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  uid?: string;
}

function getResourceOwnerUid(req: Request): string | undefined {
  const params = req.params as Record<string, unknown> | undefined;
  const raw = params?.userUid ?? params?.uid;
  return typeof raw === 'string' ? raw : undefined;
}

export const authorize =
  (rolesNeeded?: string[]) => (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const jwtSecret = process.env.JWT_SECRET;
    const requiredRoles = rolesNeeded && rolesNeeded.length > 0 ? rolesNeeded : undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret is not defined' });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const ownerUid = getResourceOwnerUid(req); // resource identifier passed in route params
    const isOwner = ownerUid
      ? decoded.uid.toLowerCase() === ownerUid.toLowerCase() // UUIDs are case-insensitive
      : false;
    const hasAllowedRole = requiredRoles ? requiredRoles.includes(decoded.role) : false;

    if (requiredRoles) {
      if (!hasAllowedRole && !isOwner) return res.status(403).json({ message: 'Forbidden' });
    } else if (ownerUid && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = decoded;
    return next();
  };
