import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/CustomError';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  void next;
  void req;
  const requestId = (res.locals as { requestId?: string } | undefined)?.requestId;

  if (err instanceof CustomError) {
    return res.status(err.code).json({
      message: err.message,
      code: err.errorCode,
      requestId,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  // eslint-disable-next-line no-console
  console.error({ requestId, err });
  return res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
  });
}
