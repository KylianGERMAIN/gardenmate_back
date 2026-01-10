import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { utils } from '../utils/uid';

export interface JwtPayload {
  uid: string;
  login: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  uid?: string;
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.uid === 'string' && typeof v.login === 'string' && typeof v.role === 'string';
}

function decodeJwtPayloadFromAuthHeader(
  authHeader: string | undefined,
  jwtSecret: string | undefined,
): JwtPayload | 'unauthorized' | 'server_error' {
  if (!authHeader?.startsWith('Bearer ')) return 'unauthorized';
  if (!jwtSecret) return 'server_error';

  const token = authHeader.slice('Bearer '.length).trim();

  let decodedUnknown: unknown;
  try {
    decodedUnknown = jwt.verify(token, jwtSecret);
  } catch {
    return 'unauthorized';
  }

  if (!isJwtPayload(decodedUnknown)) return 'unauthorized';
  return decodedUnknown;
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

    const decoded = decodeJwtPayloadFromAuthHeader(authHeader, jwtSecret);

    if (decoded === 'unauthorized') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (decoded === 'server_error') {
      return res.status(500).json({ message: 'JWT secret is not defined' });
    }

    const ownerUid = getResourceOwnerUid(req); // resource identifier passed in route params
    const isOwner = ownerUid
      ? utils.normalizeUid(decoded.uid) === utils.normalizeUid(ownerUid) // normalize to avoid casing mismatch across layers
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
