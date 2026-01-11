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
    ownerParamMissing: 'Owner parameter is not defined on this route',
    rolesNeededMissing: 'Roles needed are not defined',
  },
} as const;

type AuthResult<T> = { ok: true; value: T } | { ok: false; code: 401 | 500; message: string };

type LocalsWithRequestId = { requestId?: string };

function getRequestId(res: Response): string | undefined {
  return (res.locals as LocalsWithRequestId | undefined)?.requestId;
}

function sendAuthError(res: Response, error: Extract<AuthResult<never>, { ok: false }>) {
  const requestId = getRequestId(res);
  const errorCode =
    error.code === 401
      ? 'UNAUTHORIZED'
      : error.message === AUTH.messages.jwtSecretMissing
        ? 'SERVER_MISCONFIGURATION'
        : 'INTERNAL_SERVER_ERROR';

  return res.status(error.code).json({ message: error.message, code: errorCode, requestId });
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
  const hasBasics =
    utils.isString(value.uid) && utils.isString(value.login) && utils.isString(value.role);
  const hasType =
    value.tokenType === constants.tokenTypes.access ||
    value.tokenType === constants.tokenTypes.refresh;
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

function getOwnerUidFromParam(req: Request, ownerParam: string): string | undefined {
  const params = req.params as Record<string, unknown> | undefined;
  const raw = params?.[ownerParam];
  return utils.isString(raw) ? raw : undefined;
}

function sendForbidden(res: Response) {
  return res.status(403).json({
    message: AUTH.messages.forbidden,
    code: 'FORBIDDEN',
    requestId: getRequestId(res),
  });
}

function sendServerMisconfiguration(res: Response, message: string) {
  return res.status(500).json({
    message,
    code: 'SERVER_MISCONFIGURATION',
    requestId: getRequestId(res),
  });
}

function authorizeBase(req: RequestWithUser): AuthResult<JwtPayload> {
  const authHeader = req.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  const decodedResult = decodeJwtPayloadFromAuthHeader(
    authHeader,
    jwtSecret,
    constants.tokenTypes.access,
  );
  if (!decodedResult.ok) return decodedResult;

  req.user = decodedResult.value;
  return decodedResult;
}

/**
 * Authenticate request using access token.
 * - If roles are provided: checks role ONLY (no implicit "owner bypass").
 * - If roles are omitted: authentication only.
 */
export const authorize =
  (rolesNeeded?: string[]) => (req: RequestWithUser, res: Response, next: NextFunction) => {
    const decodedResult = authorizeBase(req);
    if (!decodedResult.ok) return sendAuthError(res, decodedResult);

    const requiredRoles = rolesNeeded && rolesNeeded.length > 0 ? rolesNeeded : undefined;
    if (requiredRoles && !requiredRoles.includes(decodedResult.value.role)) {
      return sendForbidden(res);
    }

    return next();
  };

/**
 * Authenticate request and require resource ownership based on a specific route param.
 * Example: authorizeOwner('userUid')
 */
export const authorizeOwner = (ownerParam: string) => {
  if (!ownerParam) throw new Error(AUTH.messages.ownerParamMissing);
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const decodedResult = authorizeBase(req);
    if (!decodedResult.ok) return sendAuthError(res, decodedResult);

    const ownerUid = getOwnerUidFromParam(req, ownerParam);
    if (!ownerUid) return sendServerMisconfiguration(res, AUTH.messages.ownerParamMissing);

    const isOwner = utils.normalizeUid(decodedResult.value.uid) === utils.normalizeUid(ownerUid);
    if (!isOwner) return sendForbidden(res);

    return next();
  };
};

/**
 * Authenticate request and allow access when either:
 * - user has one of the required roles, OR
 * - user is the owner (based on a specific route param)
 *
 * Example: authorizeRolesOrOwner(['ADMIN'], 'uid')
 */
export const authorizeRolesOrOwner = (rolesNeeded: string[], ownerParam: string) => {
  if (!rolesNeeded || rolesNeeded.length === 0) throw new Error(AUTH.messages.rolesNeededMissing);
  if (!ownerParam) throw new Error(AUTH.messages.ownerParamMissing);
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const decodedResult = authorizeBase(req);
    if (!decodedResult.ok) return sendAuthError(res, decodedResult);

    const hasAllowedRole = rolesNeeded.includes(decodedResult.value.role);
    if (hasAllowedRole) return next();

    const ownerUid = getOwnerUidFromParam(req, ownerParam);
    if (!ownerUid) return sendServerMisconfiguration(res, AUTH.messages.ownerParamMissing);

    const isOwner = utils.normalizeUid(decodedResult.value.uid) === utils.normalizeUid(ownerUid);
    if (!isOwner) return sendForbidden(res);

    return next();
  };
};
