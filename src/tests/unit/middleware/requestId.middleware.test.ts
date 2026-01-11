import { requestId } from '../../../middleware/requestId';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('middleware: requestId', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      locals: {},
      setHeader: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should reuse incoming x-request-id header when present', () => {
    req.headers = { 'x-request-id': 'incoming-id' };

    requestId(req as Request, res as Response, next);

    expect(res.locals).toMatchObject({ requestId: 'incoming-id' });
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'incoming-id');
    expect(randomUUID).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should generate a new UUID when x-request-id header is missing', () => {
    (randomUUID as unknown as jest.Mock).mockReturnValue('generated-id');

    requestId(req as Request, res as Response, next);

    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(res.locals).toMatchObject({ requestId: 'generated-id' });
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'generated-id');
    expect(next).toHaveBeenCalledWith();
  });

  it('should always set x-request-id response header and store in res.locals', () => {
    (randomUUID as unknown as jest.Mock).mockReturnValue('generated-id-2');

    requestId(req as Request, res as Response, next);

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'generated-id-2');
    expect((res.locals as Record<string, unknown>).requestId).toBe('generated-id-2');
  });
});
