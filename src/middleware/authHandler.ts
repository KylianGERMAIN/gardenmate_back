import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { utils } from '../utils/utils';
import { constants } from '../constants/constants';

const AUTH = {
  bearerPrefix: 'Bearer ',
  messages: {
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    jwtSecretMissing: 'JWT secret is not defined',
  },
} as const;

type AuthResult<T> = { ok: true; value: T } | { ok: false; code: 401 | 500; message: string };

function sendAuthError(res: Response, error: Extract<AuthResult<never>, { ok: false }>) {
  return res.status(error.code).json({ message: error.message });
}

export interface JwtPayload {
  uid: string;
  login: string;
  role: string;
  tokenType: (typeof constants.tokenTypes)[keyof typeof constants.tokenTypes];
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  uid?: string;
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (!utils.isRecord(value)) return false;
  const v = value;
  const hasBasics = utils.isString(v.uid) && utils.isString(v.login) && utils.isString(v.role);
  const hasType =
    v.tokenType === constants.tokenTypes.access || v.tokenType === constants.tokenTypes.refresh;
  return hasBasics && hasType;
}

function decodeJwtPayloadFromAuthHeader(
  authHeader: string | undefined,
  jwtSecret: string | undefined,
  expectedTokenType: (typeof constants.tokenTypes)[keyof typeof constants.tokenTypes],
): AuthResult<JwtPayload> {
  if (!authHeader?.startsWith(AUTH.bearerPrefix)) {
    return { ok: false, code: 401, message: AUTH.messages.unauthorized };
  }
  if (!jwtSecret) {
    return { ok: false, code: 500, message: AUTH.messages.jwtSecretMissing };
  }

  const token = authHeader.slice(AUTH.bearerPrefix.length).trim();

  let decodedUnknown: unknown;
  try {
    decodedUnknown = jwt.verify(token, jwtSecret);
  } catch {
    return { ok: false, code: 401, message: AUTH.messages.unauthorized };
  }

  if (!isJwtPayload(decodedUnknown)) {
    return { ok: false, code: 401, message: AUTH.messages.unauthorized };
  }
  if (decodedUnknown.tokenType !== expectedTokenType) {
    return { ok: false, code: 401, message: AUTH.messages.unauthorized };
  }
  return { ok: true, value: decodedUnknown };
}

function getResourceOwnerUid(req: Request): string | undefined {
  const params = req.params as Record<string, unknown> | undefined;
  const raw = params?.userUid ?? params?.uid;
  return utils.isString(raw) ? raw : undefined;
}

export const authorize =
  (rolesNeeded?: string[]) => (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const jwtSecret = process.env.JWT_SECRET;
    const requiredRoles = rolesNeeded && rolesNeeded.length > 0 ? rolesNeeded : undefined;

    const decodedResult = decodeJwtPayloadFromAuthHeader(
      authHeader,
      jwtSecret,
      constants.tokenTypes.access,
    );
    if (!decodedResult.ok) return sendAuthError(res, decodedResult);
    const decoded = decodedResult.value;

    const ownerUid = getResourceOwnerUid(req); // resource identifier passed in route params
    const isOwner = ownerUid
      ? utils.normalizeUid(decoded.uid) === utils.normalizeUid(ownerUid) // normalize to avoid casing mismatch across layers
      : false;
    const hasAllowedRole = requiredRoles ? requiredRoles.includes(decoded.role) : false;

    if (requiredRoles) {
      if (!hasAllowedRole && !isOwner)
        return res.status(403).json({ message: AUTH.messages.forbidden });
    } else if (ownerUid && !isOwner) {
      return res.status(403).json({ message: AUTH.messages.forbidden });
    }

    req.user = decoded;
    return next();
  };
