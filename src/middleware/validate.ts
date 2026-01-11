import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CustomError } from '../errors/CustomError';

export const validate =
  (schema: z.ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message =
        result.error.issues.map((issue) => issue.message).join(', ') || 'Validation error';

      return next(
        new CustomError(message, 400, 'VALIDATION_ERROR', {
          issues: result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
          })),
          source,
        }),
      );
    }

    const target = req[source] as unknown;
    if (target && typeof target === 'object') {
      Object.assign(target as Record<string, unknown>, result.data);
    } else {
      (req as unknown as Record<string, unknown>)[source] = result.data;
    }
    next();
  };
