import { prisma } from '../prisma';
import { LoginUserBody } from '../schemas/user';
import { userService } from '../service/user.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../prisma', () => ({
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

describe('userService - login (mocked)', () => {
  const JWT_SECRET = 'test_secret';
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testUser = {
    id: 1,
    login: 'testuser',
    password: 'hashedPassword',
    role: 'USER',
  };

  it('should return a token for valid login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

    const loginDto: LoginUserBody = { login: 'testuser', password: 'Admin123*' };
    const token = await userService.authenticateUser(loginDto);

    expect(token).toBe('fakeToken');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { login: 'testuser' } });
    expect(bcrypt.compare).toHaveBeenCalledWith('Admin123*', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 1, login: 'testuser', role: 'USER' }, JWT_SECRET, {
      expiresIn: '1h',
    });
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
});
