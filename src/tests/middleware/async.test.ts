import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { CustomError } from '../../errors/CustomError';

describe('asyncHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should call next with error if async function throws', async () => {
    const error = new CustomError('Test error', 400);

    const asyncFn = asyncHandler(async () => {
      throw error;
    });

    await asyncFn(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call async function without errors', async () => {
    const asyncFn = asyncHandler(async (req: Request, res: Response) => {
      res.status(200).json({ message: 'ok' });
    });

    await asyncFn(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'ok' });
    expect(next).not.toHaveBeenCalled();
  });
});
