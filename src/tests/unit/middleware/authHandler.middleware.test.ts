import {
  RequestWithUser,
  authorize,
  authorizeOwner,
  authorizeRolesOrOwner,
} from '../../../middleware/authHandler';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { constants } from '../../../constants/constants';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

const ORIGINAL_ENV = process.env;

let res: Response;
let next: NextFunction;

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';

  res = {
    locals: { requestId: 'test-request-id' },
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  next = jest.fn() as NextFunction;
});

describe('middleware: authorize', () => {
  it('should return 401 (not 500) when token is valid but payload has old schema (id instead of uid)', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      id: 1,
      login: 'testuser',
      role: 'USER',
    });

    const req = {
      headers: { authorization: 'Bearer valid-but-old-payload' },
      params: { uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' },
    } as unknown as Request;

    authorize()(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should NOT allow owner to bypass role requirements when using authorize(roles)', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: { uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' },
    } as unknown as Request;

    authorize(['ADMIN'])(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden',
      code: 'FORBIDDEN',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject refresh token used as Bearer token', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.refresh,
    });

    const req = {
      headers: { authorization: 'Bearer refresh-token' },
      params: { uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' },
    } as unknown as Request;

    authorize()(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 500 when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    const req = {
      headers: { authorization: 'Bearer access-token' },
      params: { uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796' },
    } as unknown as Request;

    authorize()(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'JWT secret is not defined',
      code: 'SERVER_MISCONFIGURATION',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('middleware: authorizeOwner', () => {
  it('should throw at initialization when ownerParam is empty (programming error)', () => {
    expect(() => authorizeOwner('' as unknown as string)).toThrow(
      'Owner parameter is not defined on this route',
    );
  });

  it('should authorize owner even if request param UUID casing differs', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: { uid: '2E1A1BCE-9D34-43B0-A927-6FD239F28796' },
    } as unknown as Request;

    authorizeOwner('uid')(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 500 when owner param is missing from req.params', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: {},
    } as unknown as Request;

    authorizeOwner('uid')(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Owner parameter is not defined on this route',
      code: 'SERVER_MISCONFIGURATION',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when authenticated user is not the owner', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: { uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    } as unknown as Request;

    authorizeOwner('uid')(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden',
      code: 'FORBIDDEN',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('middleware: authorizeRolesOrOwner', () => {
  it('should throw at initialization when rolesNeeded is empty (programming error)', () => {
    expect(() => authorizeRolesOrOwner([], 'uid')).toThrow('Roles needed are not defined');
  });

  it('should allow access when user has required role even if not owner', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'admin',
      role: 'ADMIN',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: { uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    } as unknown as Request;

    authorizeRolesOrOwner(['ADMIN'], 'uid')(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow access when role is missing but user is owner (roles OR owner)', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: { uid: '2E1A1BCE-9D34-43B0-A927-6FD239F28796' },
    } as unknown as Request;

    authorizeRolesOrOwner(['ADMIN'], 'uid')(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 when user lacks role and is not owner', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: { uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    } as unknown as Request;

    authorizeRolesOrOwner(['ADMIN'], 'uid')(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden',
      code: 'FORBIDDEN',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 500 when owner param is missing from req.params and user lacks role', () => {
    (jwt.verify as unknown as jest.Mock).mockReturnValue({
      uid: '2e1a1bce-9d34-43b0-a927-6fd239f28796',
      login: 'testuser',
      role: 'USER',
      tokenType: constants.tokenTypes.access,
    });

    const req = {
      headers: { authorization: 'Bearer valid' },
      params: {},
    } as unknown as Request;

    authorizeRolesOrOwner(['ADMIN'], 'uid')(req as RequestWithUser, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Owner parameter is not defined on this route',
      code: 'SERVER_MISCONFIGURATION',
      requestId: 'test-request-id',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
