import { CustomError } from '../../../errors/CustomError';

describe('errors: CustomError', () => {
  it('should apply default errorCode mapping for common HTTP codes', () => {
    expect(new CustomError('m', 400).errorCode).toBe('BAD_REQUEST');
    expect(new CustomError('m', 401).errorCode).toBe('UNAUTHORIZED');
    expect(new CustomError('m', 403).errorCode).toBe('FORBIDDEN');
    expect(new CustomError('m', 404).errorCode).toBe('NOT_FOUND');
    expect(new CustomError('m', 409).errorCode).toBe('CONFLICT');
    expect(new CustomError('m', 500).errorCode).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should default to HTTP_<code> for unknown codes', () => {
    expect(new CustomError('m', 418).errorCode).toBe('HTTP_418');
  });

  it('should allow overriding errorCode and store details', () => {
    const details = { foo: 'bar', nested: { ok: true } };
    const err = new CustomError('Boom', 400, 'CUSTOM_CODE', details);

    expect(err.code).toBe(400);
    expect(err.message).toBe('Boom');
    expect(err.errorCode).toBe('CUSTOM_CODE');
    expect(err.details).toEqual(details);
  });
});
