import { prisma } from '../../../prisma';
import { UserPlantDTO, userService } from '../../../service/user.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateUserBody } from '../../../schemas';
import { SunlightLevel } from '../../../generated/prisma/enums';

jest.mock('../../../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userPlant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
  type PrismaUserPlantMock = {
    userPlant: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  const prismaUserPlantCreateMock = (prisma as unknown as PrismaUserPlantMock).userPlant.create;
  const prismaUserPlantFindManyMock = (prisma as unknown as PrismaUserPlantMock).userPlant.findMany;
  const prismaUserPlantFindUniqueMock = (prisma as unknown as PrismaUserPlantMock).userPlant
    .findUnique;
  const prismaUserPlantUpdateMock = (prisma as unknown as PrismaUserPlantMock).userPlant.update;
  const prismaUserPlantDeleteMock = (prisma as unknown as PrismaUserPlantMock).userPlant.delete;

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

  it('should list user plants with plant details', async () => {
    prismaUserPlantFindManyMock.mockResolvedValue([
      {
        uid: 'user-plant-1',
        userUid: 'user-uid-1',
        plantUid: 'plant-uid-1',
        plantedAt: null,
        lastWateredAt: null,
        plant: { uid: 'plant-uid-1', name: 'Tomato', sunlightLevel: SunlightLevel.FULL_SUN },
      },
    ]);

    const result = await userService.listUserPlants('USER-UID-1');
    expect(result).toHaveLength(1);
    expect(prismaUserPlantFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userUid: 'user-uid-1' },
        select: expect.any(Object),
      }),
    );
  });

  it('should update a userPlant only if owned by user', async () => {
    prismaUserPlantFindUniqueMock.mockResolvedValue({ userUid: 'user-uid-1' });
    prismaUserPlantUpdateMock.mockResolvedValue({
      uid: 'user-plant-1',
      userUid: 'user-uid-1',
      plantUid: 'plant-uid-1',
      plantedAt: null,
      lastWateredAt: new Date('2026-01-10T00:00:00.000Z'),
    });

    const result = await userService.updateUserPlant({
      userUid: 'USER-UID-1',
      userPlantUid: 'USER-PLANT-1',
      lastWateredAt: new Date('2026-01-10T00:00:00.000Z'),
    });

    expect(result.uid).toBe('user-plant-1');
    expect(prismaUserPlantFindUniqueMock).toHaveBeenCalledWith({
      where: { uid: 'user-plant-1' },
      select: { userUid: true },
    });
    expect(prismaUserPlantUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { uid: 'user-plant-1' },
        data: { lastWateredAt: new Date('2026-01-10T00:00:00.000Z') },
      }),
    );
  });

  it('should return 404 when updating a userPlant not owned by user', async () => {
    prismaUserPlantFindUniqueMock.mockResolvedValue({ userUid: 'someone-else' });

    await expect(
      userService.updateUserPlant({
        userUid: 'user-uid-1',
        userPlantUid: 'user-plant-1',
        lastWateredAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 404 });

    expect(prismaUserPlantUpdateMock).not.toHaveBeenCalled();
  });

  it('should delete a userPlant only if owned by user', async () => {
    prismaUserPlantFindUniqueMock.mockResolvedValue({ userUid: 'user-uid-1' });
    prismaUserPlantDeleteMock.mockResolvedValue({
      uid: 'user-plant-1',
      userUid: 'user-uid-1',
      plantUid: 'plant-uid-1',
      plantedAt: null,
      lastWateredAt: null,
    });

    const result = await userService.deleteUserPlant({
      userUid: 'user-uid-1',
      userPlantUid: 'user-plant-1',
    });

    expect(result.uid).toBe('user-plant-1');
    expect(prismaUserPlantDeleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { uid: 'user-plant-1' } }),
    );
  });

  it('should return 404 when deleting a userPlant not owned by user', async () => {
    prismaUserPlantFindUniqueMock.mockResolvedValue({ userUid: 'someone-else' });

    await expect(
      userService.deleteUserPlant({
        userUid: 'user-uid-1',
        userPlantUid: 'user-plant-1',
      }),
    ).rejects.toMatchObject({ code: 404 });

    expect(prismaUserPlantDeleteMock).not.toHaveBeenCalled();
  });
});
