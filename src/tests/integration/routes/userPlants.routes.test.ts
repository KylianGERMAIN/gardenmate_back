import jwt from 'jsonwebtoken';
import { CustomError } from '../../../errors/CustomError';
import { constants } from '../../../constants/constants';
import { userService } from '../../../service/user.service';
import { startTestServer } from '../../helpers/httpServer';

jest.mock('../../../service/user.service', () => ({
  userService: {
    listUserPlants: jest.fn(),
    updateUserPlant: jest.fn(),
    deleteUserPlant: jest.fn(),
  },
}));

function makeAccessToken(params: { uid: string; login?: string; role?: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set for integration tests');

  return jwt.sign(
    {
      uid: params.uid,
      login: params.login ?? 'testuser',
      role: params.role ?? 'USER',
      tokenType: constants.tokenTypes.access,
    },
    secret,
    { expiresIn: '1h' },
  );
}

describe('routes: /users/:userUid/plants', () => {
  const ORIGINAL_ENV = process.env;
  const JWT_SECRET = 'test_secret';

  let baseUrl: string;
  let close: () => Promise<void>;

  beforeAll(async () => {
    process.env = { ...ORIGINAL_ENV, JWT_SECRET };
    const server = await startTestServer();
    baseUrl = server.baseUrl;
    close = server.close;
  });

  afterAll(async () => {
    await close();
    process.env = ORIGINAL_ENV;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/:userUid/plants', () => {
    const userUidLower = '2e1a1bce-9d34-43b0-a927-6fd239f28796';

    it('should return 401 when missing Authorization header', async () => {
      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants`, {
        method: 'GET',
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: 'Unauthorized' });
      expect(userService.listUserPlants).not.toHaveBeenCalled();
    });

    it('should return 403 when token user is not resource owner', async () => {
      const token = makeAccessToken({ uid: userUidLower });
      const otherUserUid = '11111111-1111-1111-1111-111111111111';

      const res = await fetch(`${baseUrl}/users/${otherUserUid}/plants`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: 'Forbidden' });
      expect(userService.listUserPlants).not.toHaveBeenCalled();
    });

    it('should validate params and return 400 for invalid user uid', async () => {
      // authorize() runs before validate(), so we must pass ownership check first
      const token = makeAccessToken({ uid: 'not-a-uuid' });

      const res = await fetch(`${baseUrl}/users/not-a-uuid/plants`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('message');
      expect(userService.listUserPlants).not.toHaveBeenCalled();
    });

    it('should return 200 and list user plants on success', async () => {
      const userUidUpper = userUidLower.toUpperCase();
      const token = makeAccessToken({ uid: userUidLower });

      (userService.listUserPlants as jest.Mock).mockResolvedValue([
        {
          uid: '7d93c7e0-73de-4b86-96fc-64e14910a8e1',
          userUid: userUidLower,
          plantUid: '8a0a6f5a-7e35-4f37-9a88-0e8a2a5b5d0a',
          plantedAt: null,
          lastWateredAt: null,
          plant: {
            uid: '8a0a6f5a-7e35-4f37-9a88-0e8a2a5b5d0a',
            name: 'Tomato',
            sunlightLevel: 'FULL_SUN',
          },
        },
      ]);

      const res = await fetch(`${baseUrl}/users/${userUidUpper}/plants`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([
        {
          uid: '7d93c7e0-73de-4b86-96fc-64e14910a8e1',
          userUid: userUidLower,
          plantUid: '8a0a6f5a-7e35-4f37-9a88-0e8a2a5b5d0a',
          plantedAt: null,
          lastWateredAt: null,
          plant: {
            uid: '8a0a6f5a-7e35-4f37-9a88-0e8a2a5b5d0a',
            name: 'Tomato',
            sunlightLevel: 'FULL_SUN',
          },
        },
      ]);

      expect(userService.listUserPlants).toHaveBeenCalledWith(userUidLower);
    });

    it('should propagate service errors', async () => {
      const token = makeAccessToken({ uid: userUidLower });
      (userService.listUserPlants as jest.Mock).mockRejectedValue(new CustomError('Nope', 500));

      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ message: 'Nope' });
    });
  });

  describe('PATCH /users/:userUid/plants/:uid', () => {
    const userUidLower = '2e1a1bce-9d34-43b0-a927-6fd239f28796';
    const userPlantUidLower = '7d93c7e0-73de-4b86-96fc-64e14910a8e1';
    const plantUidLower = '8a0a6f5a-7e35-4f37-9a88-0e8a2a5b5d0a';

    it('should return 401 when missing Authorization header', async () => {
      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/${userPlantUidLower}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lastWateredAt: '2026-01-10T00:00:00.000Z' }),
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: 'Unauthorized' });
      expect(userService.updateUserPlant).not.toHaveBeenCalled();
    });

    it('should return 403 when token user is not resource owner', async () => {
      const token = makeAccessToken({ uid: userUidLower });
      const otherUserUid = '11111111-1111-1111-1111-111111111111';

      const res = await fetch(`${baseUrl}/users/${otherUserUid}/plants/${userPlantUidLower}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lastWateredAt: '2026-01-10T00:00:00.000Z' }),
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: 'Forbidden' });
      expect(userService.updateUserPlant).not.toHaveBeenCalled();
    });

    it('should validate params and return 400 for invalid userPlant uid', async () => {
      const token = makeAccessToken({ uid: userUidLower });

      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/not-a-uuid`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lastWateredAt: '2026-01-10T00:00:00.000Z' }),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('message');
      expect(userService.updateUserPlant).not.toHaveBeenCalled();
    });

    it('should validate body and return 400 when missing fields', async () => {
      const token = makeAccessToken({ uid: userUidLower });

      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/${userPlantUidLower}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('message');
      expect(userService.updateUserPlant).not.toHaveBeenCalled();
    });

    it('should return 200 and updated payload on success', async () => {
      const userUidUpper = userUidLower.toUpperCase();
      const userPlantUidUpper = userPlantUidLower.toUpperCase();

      const token = makeAccessToken({ uid: userUidLower });
      (userService.updateUserPlant as jest.Mock).mockResolvedValue({
        uid: userPlantUidLower,
        userUid: userUidLower,
        plantUid: plantUidLower,
        plantedAt: null,
        lastWateredAt: new Date('2026-01-10T00:00:00.000Z'),
      });

      const res = await fetch(`${baseUrl}/users/${userUidUpper}/plants/${userPlantUidUpper}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lastWateredAt: '2026-01-10T00:00:00.000Z' }),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        uid: userPlantUidLower,
        userUid: userUidLower,
        plantUid: plantUidLower,
        plantedAt: null,
        lastWateredAt: '2026-01-10T00:00:00.000Z',
      });

      expect(userService.updateUserPlant).toHaveBeenCalledWith({
        userUid: userUidLower,
        userPlantUid: userPlantUidLower,
        plantedAt: undefined,
        lastWateredAt: new Date('2026-01-10T00:00:00.000Z'),
      });
    });

    it('should propagate service errors', async () => {
      const token = makeAccessToken({ uid: userUidLower });
      (userService.updateUserPlant as jest.Mock).mockRejectedValue(
        new CustomError('User plant not found', 404),
      );

      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/${userPlantUidLower}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lastWateredAt: '2026-01-10T00:00:00.000Z' }),
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: 'User plant not found' });
    });
  });

  describe('DELETE /users/:userUid/plants/:uid', () => {
    const userUidLower = '2e1a1bce-9d34-43b0-a927-6fd239f28796';
    const userPlantUidLower = '7d93c7e0-73de-4b86-96fc-64e14910a8e1';
    const plantUidLower = '8a0a6f5a-7e35-4f37-9a88-0e8a2a5b5d0a';

    it('should return 401 when missing Authorization header', async () => {
      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/${userPlantUidLower}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ message: 'Unauthorized' });
      expect(userService.deleteUserPlant).not.toHaveBeenCalled();
    });

    it('should return 403 when token user is not resource owner', async () => {
      const token = makeAccessToken({ uid: userUidLower });
      const otherUserUid = '11111111-1111-1111-1111-111111111111';

      const res = await fetch(`${baseUrl}/users/${otherUserUid}/plants/${userPlantUidLower}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ message: 'Forbidden' });
      expect(userService.deleteUserPlant).not.toHaveBeenCalled();
    });

    it('should validate params and return 400 for invalid userPlant uid', async () => {
      const token = makeAccessToken({ uid: userUidLower });

      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/not-a-uuid`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toHaveProperty('message');
      expect(userService.deleteUserPlant).not.toHaveBeenCalled();
    });

    it('should return 200 and deleted payload on success', async () => {
      const userUidUpper = userUidLower.toUpperCase();
      const userPlantUidUpper = userPlantUidLower.toUpperCase();

      const token = makeAccessToken({ uid: userUidLower });
      (userService.deleteUserPlant as jest.Mock).mockResolvedValue({
        uid: userPlantUidLower,
        userUid: userUidLower,
        plantUid: plantUidLower,
        plantedAt: null,
        lastWateredAt: null,
      });

      const res = await fetch(`${baseUrl}/users/${userUidUpper}/plants/${userPlantUidUpper}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        uid: userPlantUidLower,
        userUid: userUidLower,
        plantUid: plantUidLower,
        plantedAt: null,
        lastWateredAt: null,
      });

      expect(userService.deleteUserPlant).toHaveBeenCalledWith({
        userUid: userUidLower,
        userPlantUid: userPlantUidLower,
      });
    });

    it('should propagate service errors', async () => {
      const token = makeAccessToken({ uid: userUidLower });
      (userService.deleteUserPlant as jest.Mock).mockRejectedValue(
        new CustomError('User plant not found', 404),
      );

      const res = await fetch(`${baseUrl}/users/${userUidLower}/plants/${userPlantUidLower}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: 'User plant not found' });
    });
  });
});
