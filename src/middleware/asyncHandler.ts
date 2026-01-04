import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
