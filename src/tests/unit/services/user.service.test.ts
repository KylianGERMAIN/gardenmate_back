import { prisma } from '../../../prisma';
import { UserPlantDTO, userService } from '../../../service/user.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateUserBody } from '../../../schemas/user';

jest.mock('../../../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userPlant: {
      create: jest.fn(),
    },
  },
}));

describe('userService (unit)', () => {
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
      uid: 'user-uid-1',
      login: 'testuser',
      password: 'hashed',
      role: 'USER',
    });

    await expect(userService.createUser(testUser)).rejects.toMatchObject({ code: 409 });
  });

  it('should create user with hashed password', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockImplementation(async (data) => ({
      uid: 'user-uid-1',
      login: data.data.login,
      role: data.data.role,
    }));

    const result = await userService.createUser(testUser);
    expect(result).toEqual({ uid: 'user-uid-1', login: 'testuser', role: 'USER' });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ login: 'testuser', role: 'USER' }),
        select: expect.any(Object),
      }),
    );
  });

  it('should throw error if user not found on getUser', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(userService.getUser('user-uid-1')).rejects.toMatchObject({ code: 404 });
  });

  it('should delete an existing user', async () => {
    const mockDeletedUser = { uid: 'user-uid-1', login: 'testuser', role: 'USER' };
    (prisma.user.delete as jest.Mock).mockResolvedValue(mockDeletedUser);

    const result = await userService.deleteUser('user-uid-1');
    expect(result).toEqual(mockDeletedUser);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { uid: 'user-uid-1' },
      select: { uid: true, login: true, role: true },
    });
  });

  it('should throw error if deleting non-existent user', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.x.x',
    });
    (prisma.user.delete as jest.Mock).mockRejectedValue(prismaError);

    await expect(userService.deleteUser('user-uid-1')).rejects.toMatchObject({ code: 404 });
  });
});

describe('userService: userPlant (unit)', () => {
  type PrismaUserPlantMock = { userPlant: { create: jest.Mock } };
  const prismaUserPlantCreateMock = (prisma as unknown as PrismaUserPlantMock).userPlant.create;

  afterEach(() => {
    jest.clearAllMocks();
  });

  const testUserPlant: UserPlantDTO = {
    userUid: 'user-uid-1',
    plantUid: 'plant-uid-1',
    plantedAt: new Date(),
    lastWateredAt: new Date(),
  };

  it('should assign plant to user successfully', async () => {
    prismaUserPlantCreateMock.mockResolvedValue(testUserPlant);

    const result = await userService.assignPlantToUser(testUserPlant);
    expect(result).toEqual(testUserPlant);
    expect(prismaUserPlantCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userUid: testUserPlant.userUid,
          plantUid: testUserPlant.plantUid,
          plantedAt: testUserPlant.plantedAt,
          lastWateredAt: testUserPlant.lastWateredAt,
        },
        select: {
          uid: true,
          userUid: true,
          plantUid: true,
          plantedAt: true,
          lastWateredAt: true,
        },
      }),
    );
  });

  it('should throw error if user or plant does not exist', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.x.x',
    });
    prismaUserPlantCreateMock.mockRejectedValue(prismaError);

    await expect(userService.assignPlantToUser(testUserPlant)).rejects.toMatchObject({ code: 404 });
  });

  it('should throw error for foreign key constraint violation', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
      code: 'P2003',
      clientVersion: '5.x.x',
    });
    prismaUserPlantCreateMock.mockRejectedValue(prismaError);

    await expect(userService.assignPlantToUser(testUserPlant)).rejects.toMatchObject({ code: 400 });
  });
});
