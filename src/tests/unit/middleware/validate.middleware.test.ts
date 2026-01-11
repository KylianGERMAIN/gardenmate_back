import { validate } from '../../../middleware/validate';
import { z } from 'zod';
import { CustomError } from '../../../errors/CustomError';
import { Request, Response, NextFunction } from 'express';

describe('middleware: validate', () => {
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

  it('should attach transformed data (e.g., normalize UUID casing)', () => {
    const schema = z.object({
      uid: z
        .string()
        .uuid()
        .transform((value) => value.toLowerCase()),
    });

    const req = {
      params: { uid: '2E1A1BCE-9D34-43B0-A927-6FD239F28796' },
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    expect(req.params).toEqual({ uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' });
    expect(next).toHaveBeenCalledWith();
  });

  it('should keep the same object reference when attaching parsed data (Object.assign)', () => {
    const schema = z.object({
      uid: z.string().uuid(),
    });

    const originalParams = { uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' };
    const req = {
      params: originalParams,
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    // Same reference, not replaced
    expect(req.params).toBe(originalParams);
    expect(req.params).toEqual({ uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' });
    expect(next).toHaveBeenCalledWith();
  });

  it('should fallback-assign parsed data when current value is undefined', () => {
    const schema = z.any().transform(() => ({ ok: true }));

    const req = {} as unknown as Request;
    const next = jest.fn() as NextFunction;

    validate(schema, 'body')(req, res, next);

    expect((req as unknown as { body: unknown }).body).toEqual({ ok: true });
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

  it('should include structured validation details (issues + source) on error', () => {
    const schema = z.object({
      uid: z.string().uuid({ message: 'Invalid user uid' }),
    });

    const req = {
      params: { uid: 'not-a-uuid' },
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'params')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = (next as jest.Mock).mock.calls[0][0] as CustomError;

    expect(error).toBeInstanceOf(CustomError);
    expect(error.code).toBe(400);
    expect(error.errorCode).toBe('VALIDATION_ERROR');

    expect(error.details).toEqual(
      expect.objectContaining({
        source: 'params',
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['uid'],
            message: 'Invalid user uid',
            code: expect.any(String),
          }),
        ]),
      }),
    );
  });

  it('should fallback-assign parsed data when current value is not an object', () => {
    const schema = z.string().transform((value) => value.toUpperCase());

    const req = {
      // Not an object (so Object.assign cannot be used)
      body: 'hello',
    } as unknown as Request;

    const next = jest.fn() as NextFunction;

    validate(schema, 'body')(req, res, next);

    expect((req as unknown as { body: unknown }).body).toBe('HELLO');
    expect(next).toHaveBeenCalledWith();
  });
});
