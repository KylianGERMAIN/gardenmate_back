export class CustomError extends Error {
  code: number;
  errorCode: string;
  details?: unknown;

  constructor(message: string, code = 400, errorCode?: string, details?: unknown) {
    super(message);
    this.code = code;
    this.errorCode =
      errorCode ??
      (code === 400
        ? 'BAD_REQUEST'
        : code === 401
          ? 'UNAUTHORIZED'
          : code === 403
            ? 'FORBIDDEN'
            : code === 404
              ? 'NOT_FOUND'
              : code === 409
                ? 'CONFLICT'
                : code === 500
                  ? 'INTERNAL_SERVER_ERROR'
                  : `HTTP_${code}`);
    this.details = details;
  }
}
