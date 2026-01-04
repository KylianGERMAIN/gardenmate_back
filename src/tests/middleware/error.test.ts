import { errorHandler } from '../../middleware/errorHandler';
import { CustomError } from '../../errors/CustomError';
import { Request, Response, NextFunction } from 'express';

describe('errorHandler middleware', () => {
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

  it('should handle CustomError correctly', () => {
    const customError = new CustomError('Test error', 400);

    errorHandler(customError, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Test error' });
  });

  it('should handle generic errors as 500', () => {
    const genericError = new Error('Something went wrong');

    console.error = jest.fn(); // mock console.error

    errorHandler(genericError, req as Request, res as Response, next);

    expect(console.error).toHaveBeenCalledWith(genericError);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
