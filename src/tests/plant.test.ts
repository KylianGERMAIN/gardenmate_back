import { plantService } from '../service/plant.service';
import { prisma } from '../prisma';
import { SunlightLevel } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';

jest.mock('../prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('plantService - unit tests', () => {
  afterEach(() => jest.clearAllMocks());

  it('should call prisma.plant.findMany with correct filter', async () => {
    (prisma.plant.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Rose', sunlightLevel: SunlightLevel.FULL_SUN },
    ]);

    const result = await plantService.findPlants({ sunlightLevel: SunlightLevel.FULL_SUN });

    expect(prisma.plant.findMany).toHaveBeenCalledWith({
      where: { sunlightLevel: SunlightLevel.FULL_SUN },
    });
    expect(result[0].name).toBe('Rose');
  });

  it('should throw CustomError on unique constraint violation', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x.x',
    });
    (prisma.plant.create as jest.Mock).mockRejectedValue(prismaError);

    await expect(
      plantService.createPlant({ name: 'Rose', sunlightLevel: SunlightLevel.FULL_SUN }),
    ).rejects.toMatchObject({ code: 409 });
  });

  it('should throw CustomError on deleting non-existent plant', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record to delete does not exist',
      { code: 'P2025', clientVersion: '5.x.x' },
    );
    (prisma.plant.delete as jest.Mock).mockRejectedValue(prismaError);

    await expect(plantService.deletePlant(999)).rejects.toMatchObject({ code: 404 });
  });
});
