import { userService } from '../../../service/user.service';
import { CustomError } from '../../../errors/CustomError';
import { startTestServer } from '../../helpers/httpServer';

jest.mock('../../../service/user.service', () => ({
  userService: {
    authenticateUser: jest.fn(),
    refreshTokens: jest.fn(),
  },
}));

describe('routes: /auth', () => {
  let baseUrl: string;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const server = await startTestServer();
    baseUrl = server.baseUrl;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should validate body and return 400 when missing fields', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'testuser' }),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('message');
      expect(userService.authenticateUser).not.toHaveBeenCalled();
    });

    it('should return tokens on success', async () => {
      (userService.authenticateUser as jest.Mock).mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'testuser', password: 'Admin123*' }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(userService.authenticateUser).toHaveBeenCalledWith({
        login: 'testuser',
        password: 'Admin123*',
      });
    });

    it('should propagate service errors', async () => {
      (userService.authenticateUser as jest.Mock).mockRejectedValue(new CustomError('Nope', 401));

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'testuser', password: 'bad' }),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: 'Nope' });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should validate body and return 400 when missing refreshToken', async () => {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('message');
      expect(userService.refreshTokens).not.toHaveBeenCalled();
    });

    it('should return tokens on success', async () => {
      (userService.refreshTokens as jest.Mock).mockResolvedValue({
        accessToken: 'newAccess',
        refreshToken: 'newRefresh',
      });

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'r1' }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ accessToken: 'newAccess', refreshToken: 'newRefresh' });
      expect(userService.refreshTokens).toHaveBeenCalledWith('r1');
    });

    it('should propagate service errors', async () => {
      (userService.refreshTokens as jest.Mock).mockRejectedValue(new CustomError('Bad token', 401));

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'bad' }),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: 'Bad token' });
    });
  });
});
