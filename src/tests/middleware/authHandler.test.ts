import { RequestWithUser, authorize } from '../../middleware/authHandler';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { constants } from '../../constants/constants';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

describe('authorize middleware', () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

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
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
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

    authorize()(req as RequestWithUser, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
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
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
