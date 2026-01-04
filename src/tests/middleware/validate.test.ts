import { validate } from '../../middleware/validate';
import { z } from 'zod';
import { CustomError } from '../../errors/CustomError';
import { Request, Response, NextFunction } from 'express';

describe('validate middleware', () => {
  const res = {} as Response;

  it('should call next() and attach parsed data when valid', () => {
    const schema = z.object({
      id: z.string().transform(Number),
    });

    const req = {
      params: { id: '42' },
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    expect(req.params).toEqual({ id: 42 });
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with CustomError when invalid', () => {
    const schema = z.object({
      id: z.number().min(1),
    });

    const req = {
      params: { id: 'abc' },
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = (next as jest.Mock).mock.calls[0][0];

    expect(error).toBeInstanceOf(CustomError);
    expect(error.code).toBe(400);
  });
});
