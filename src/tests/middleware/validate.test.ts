import { validate } from '../../middleware/validate';
import { z } from 'zod';
import { CustomError } from '../../errors/CustomError';
import { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
  const res = {} as Response;

  it('should call next() and attach parsed data when valid', () => {
    const schema = z.object({
      uid: z.string().uuid(),
    });

    const req = {
      params: { uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' },
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    expect(req.params).toEqual({ uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' });
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with CustomError when invalid', () => {
    const schema = z.object({
      uid: z.string().uuid().min(1),
    });

    const req = {
      params: { uid: 'not-a-uuid' },
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = (next as jest.Mock).mock.calls[0][0];

    expect(error).toBeInstanceOf(CustomError);
    expect(error.code).toBe(400);
  });
});
