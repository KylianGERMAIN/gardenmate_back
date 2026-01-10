import { plantService } from '../../../service/plant.service';
import { prisma } from '../../../prisma';
import { SunlightLevel } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';

jest.mock('../../../prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('plantService (unit)', () => {
  afterEach(() => jest.clearAllMocks());

  it('should call prisma.plant.findMany with correct filter', async () => {
    (prisma.plant.findMany as jest.Mock).mockResolvedValue([
      { uid: 'plant-uid-1', name: 'Rose', sunlightLevel: SunlightLevel.FULL_SUN },
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

    await expect(plantService.deletePlant('non-existent-uid')).rejects.toMatchObject({ code: 404 });
  });

  it('should create and return a new plant', async () => {
    const newPlant = {
      uid: 'plant-uid-1',
      name: 'Tulip',
      sunlightLevel: SunlightLevel.PARTIAL_SHADE,
    };
    (prisma.plant.create as jest.Mock).mockResolvedValue(newPlant);

    const result = await plantService.createPlant({
      name: 'Tulip',
      sunlightLevel: SunlightLevel.PARTIAL_SHADE,
    });

    expect(prisma.plant.create).toHaveBeenCalledWith({
      data: { name: 'Tulip', sunlightLevel: SunlightLevel.PARTIAL_SHADE },
    });
    expect(result).toEqual({
      uid: 'plant-uid-1',
      name: 'Tulip',
      sunlightLevel: SunlightLevel.PARTIAL_SHADE,
    });
  });

  it('should delete and return the deleted plant', async () => {
    const deletedPlant = { uid: 'plant-uid-2', name: 'Daisy', sunlightLevel: SunlightLevel.SHADE };
    (prisma.plant.delete as jest.Mock).mockResolvedValue(deletedPlant);

    const result = await plantService.deletePlant('plant-uid-2');

    expect(prisma.plant.delete).toHaveBeenCalledWith({ where: { uid: 'plant-uid-2' } });
    expect(result).toEqual({
      uid: 'plant-uid-2',
      name: 'Daisy',
      sunlightLevel: SunlightLevel.SHADE,
    });
  });
});
