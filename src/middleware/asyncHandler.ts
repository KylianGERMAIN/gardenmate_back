import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler<TReq extends Request = Request, TRes extends Response = Response> = (
  req: TReq,
  res: TRes,
  next: NextFunction,
) => void | Promise<void>;

/**
 * Middleware to handle async route handlers and pass errors to next()
 */
export const asyncHandler = <TReq extends Request = Request, TRes extends Response = Response>(
  fn: AsyncRouteHandler<TReq, TRes>,
) => {
  return (req: TReq, res: TRes, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
