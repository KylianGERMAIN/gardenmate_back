import { errorHandler } from '../../../middleware/errorHandler';
import { CustomError } from '../../../errors/CustomError';
import { Request, Response, NextFunction } from 'express';

describe('middleware: errorHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      locals: { requestId: 'test-request-id' },
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should handle CustomError correctly', () => {
    const customError = new CustomError('Test error', 400);

    errorHandler(customError, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Test error',
      code: 'BAD_REQUEST',
      requestId: 'test-request-id',
    });
  });

  it('should include CustomError details in response when provided', () => {
    const customError = new CustomError('Invalid', 400, 'VALIDATION_ERROR', {
      source: 'body',
      issues: [{ path: ['uid'], message: 'Invalid uid', code: 'invalid_string' }],
    });

    errorHandler(customError, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid',
      code: 'VALIDATION_ERROR',
      requestId: 'test-request-id',
      details: {
        source: 'body',
        issues: [{ path: ['uid'], message: 'Invalid uid', code: 'invalid_string' }],
      },
    });
  });

  it('should handle generic errors as 500', () => {
    const genericError = new Error('Something went wrong');

    console.error = jest.fn(); // mock console.error

    errorHandler(genericError, req as Request, res as Response, next);

    expect(console.error).toHaveBeenCalledWith({
      requestId: 'test-request-id',
      err: genericError,
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      requestId: 'test-request-id',
    });
  });
});
