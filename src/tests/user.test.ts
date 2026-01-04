import { prisma } from '../prisma';
import { userService } from '../service/user.service';
import { Prisma } from '../generated/prisma/client';
import { CreateUserBody } from '../schemas/user';

jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('userService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const testUser: CreateUserBody = {
    login: 'testuser',
    password: 'Admin123*',
    role: 'USER',
  };

  it('should throw error if user already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      login: 'testuser',
      password: 'hashed',
      role: 'USER',
    });

    await expect(userService.createUser(testUser)).rejects.toMatchObject({ code: 409 });
  });

  it('should create user with hashed password', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockImplementation(async (data) => ({
      id: 1,
      login: data.data.login,
      role: data.data.role,
    }));

    const result = await userService.createUser(testUser);
    expect(result).toEqual({ id: 1, login: 'testuser', role: 'USER' });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ login: 'testuser', role: 'USER' }),
        select: expect.any(Object),
      }),
    );
  });

  it('should throw error if user not found on getUser', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(userService.getUser(1)).rejects.toMatchObject({ code: 404 });
  });

  it('should delete an existing user', async () => {
    const mockDeletedUser = { id: 1, login: 'testuser', role: 'USER' };
    (prisma.user.delete as jest.Mock).mockResolvedValue(mockDeletedUser);

    const result = await userService.deleteUser(1);
    expect(result).toEqual(mockDeletedUser);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, login: true, role: true },
    });
  });

  it('should throw error if deleting non-existent user', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.x.x',
    });
    (prisma.user.delete as jest.Mock).mockRejectedValue(prismaError);

    await expect(userService.deleteUser(1)).rejects.toMatchObject({ code: 404 });
  });
});
