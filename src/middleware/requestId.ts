import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { utils } from '../utils/utils';

/**
 * Attach a request id for tracing/debugging.
 * - Reuses incoming x-request-id if present (string)
 * - Otherwise generates a UUID
 * - Always sets response header x-request-id
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const existing = utils.isString(incoming) ? incoming : undefined;
  const id = existing ?? randomUUID();

  res.locals.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
