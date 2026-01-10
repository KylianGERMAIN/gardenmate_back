import { constants } from '../../../constants/constants';
import { prisma } from '../../../prisma';
import { LoginUserBody } from '../../../schemas/user';
import { userService } from '../../../service/user.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../../../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('userService: auth (mocked)', () => {
  const JWT_SECRET = 'test_secret';
  const REFRESH_JWT_SECRET = 'refresh_secret';
  const ORIGINAL_ENV = process.env;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.REFRESH_JWT_SECRET = REFRESH_JWT_SECRET;
  });

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.REFRESH_JWT_SECRET = REFRESH_JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testUser = {
    uid: 'user-uid-1',
    login: 'testuser',
    password: 'hashedPassword',
    role: 'USER',
  };

  describe('authenticateUser', () => {
    it('should return access + refresh tokens for valid login', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('fakeAccessToken')
        .mockReturnValueOnce('fakeRefreshToken');

      const loginDto: LoginUserBody = { login: 'testuser', password: 'Admin123*' };
      const tokens = await userService.authenticateUser(loginDto);

      expect(tokens).toEqual({ accessToken: 'fakeAccessToken', refreshToken: 'fakeRefreshToken' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { login: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('Admin123*', 'hashedPassword');
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        {
          uid: 'user-uid-1',
          login: 'testuser',
          role: 'USER',
          tokenType: constants.tokenTypes.access,
        },
        JWT_SECRET,
        { expiresIn: '15m' },
      );
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        {
          uid: 'user-uid-1',
          login: 'testuser',
          role: 'USER',
          tokenType: constants.tokenTypes.refresh,
        },
        REFRESH_JWT_SECRET,
        { expiresIn: '30d' },
      );
    });

    it('should throw error for invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginDto: LoginUserBody = { login: 'testuser', password: 'WrongPassword1!' };
      await expect(userService.authenticateUser(loginDto)).rejects.toMatchObject({ code: 401 });
    });

    it('should throw error if user does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const loginDto: LoginUserBody = { login: 'nonexistent', password: 'Admin123*' };
      await expect(userService.authenticateUser(loginDto)).rejects.toMatchObject({ code: 404 });
    });

    it('should throw 500 when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginUserBody = { login: 'testuser', password: 'Admin123*' };
      await expect(userService.authenticateUser(loginDto)).rejects.toMatchObject({
        code: 500,
        message: 'JWT secret is not defined',
      });
    });

    it('should throw 500 when REFRESH_JWT_SECRET is missing', async () => {
      delete process.env.REFRESH_JWT_SECRET;

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginDto: LoginUserBody = { login: 'testuser', password: 'Admin123*' };
      await expect(userService.authenticateUser(loginDto)).rejects.toMatchObject({
        code: 500,
        message: 'Refresh JWT secret is not defined',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should exchange refresh token for new access + refresh tokens', async () => {
      const rawUid = 'USER-UID-1';
      const normalizedUid = rawUid.toLowerCase();

      (jwt.verify as jest.Mock).mockReturnValue({
        uid: rawUid,
        login: 'testuser',
        role: 'USER',
        tokenType: constants.tokenTypes.refresh,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        uid: normalizedUid,
        login: 'testuser',
        role: 'USER',
      });

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const tokens = await userService.refreshTokens('validRefresh');

      expect(tokens).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });

      expect(jwt.verify).toHaveBeenCalledWith('validRefresh', REFRESH_JWT_SECRET);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { uid: normalizedUid },
        select: { uid: true, login: true, role: true },
      });
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        {
          uid: normalizedUid,
          login: 'testuser',
          role: 'USER',
          tokenType: constants.tokenTypes.access,
        },
        JWT_SECRET,
        { expiresIn: '15m' },
      );
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        {
          uid: normalizedUid,
          login: 'testuser',
          role: 'USER',
          tokenType: constants.tokenTypes.refresh,
        },
        REFRESH_JWT_SECRET,
        { expiresIn: '30d' },
      );
    });

    it('should throw 401 for invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(userService.refreshTokens('bad')).rejects.toMatchObject({ code: 401 });
    });

    it('should throw 401 for malformed refresh token payload (missing uid/login/role)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        tokenType: constants.tokenTypes.refresh,
      });

      await expect(userService.refreshTokens('malformed')).rejects.toMatchObject({ code: 401 });
    });

    it('should throw 401 when user no longer exists', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        uid: 'user-uid-1',
        login: 'testuser',
        role: 'USER',
        tokenType: constants.tokenTypes.refresh,
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.refreshTokens('validRefresh')).rejects.toMatchObject({ code: 401 });
    });

    it('should throw 500 when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;

      await expect(userService.refreshTokens('validRefresh')).rejects.toMatchObject({
        code: 500,
        message: 'JWT secret is not defined',
      });
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should throw 500 when REFRESH_JWT_SECRET is missing', async () => {
      delete process.env.REFRESH_JWT_SECRET;

      await expect(userService.refreshTokens('validRefresh')).rejects.toMatchObject({
        code: 500,
        message: 'Refresh JWT secret is not defined',
      });
      expect(jwt.verify).not.toHaveBeenCalled();
    });
  });
});
