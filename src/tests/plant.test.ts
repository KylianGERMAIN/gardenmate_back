import { plantService, PlantDTO, GetPlantsParams } from '../service/plant.service';
import { prisma } from '../prisma';
import { CustomError } from '../errors/CustomError';
import { SunlightLevel } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('plantService.getPlants', () => {
  const mockPlants: PlantDTO[] = [
    { id: 1, name: 'Rose', sunlightLevel: SunlightLevel.FULL_SUN },
    { id: 2, name: 'Fern', sunlightLevel: SunlightLevel.SHADE },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error for invalid sunlightLevel', async () => {
    const params = {
      sunlightLevel: 'INVALID',
    } as unknown as GetPlantsParams;

    await expect(plantService.findPlants(params)).rejects.toThrow(CustomError);
    await expect(plantService.findPlants(params)).rejects.toMatchObject({ code: 400 });
  });

  it('should call prisma.plant.findMany with correct sunlightLevel', async () => {
    const params: GetPlantsParams = {
      sunlightLevel: 'FULL_SUN',
    };
    (prisma.plant.findMany as jest.Mock).mockResolvedValue([mockPlants[0]]);

    const result = await plantService.findPlants(params);

    expect(prisma.plant.findMany).toHaveBeenCalledWith({
      where: { sunlightLevel: SunlightLevel.FULL_SUN },
    });
    expect(result).toEqual([mockPlants[0]]);
  });

  it('should call prisma.plant.findMany with correct name', async () => {
    const params: GetPlantsParams = {
      name: 'Rose',
    };
    (prisma.plant.findMany as jest.Mock).mockResolvedValue([mockPlants[0]]);

    const result = await plantService.findPlants(params);

    expect(prisma.plant.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'Rose',
          mode: 'insensitive',
        },
      },
    });
    expect(result).toEqual([mockPlants[0]]);
  });
});

describe('plantService.createPlant', () => {
  const mockPlant: PlantDTO = { id: 1, name: 'Rose', sunlightLevel: SunlightLevel.FULL_SUN };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error for invalid sunlightLevel', async () => {
    const invalidPlant = { ...mockPlant, sunlightLevel: 'INVALID' as unknown as SunlightLevel };

    const plant = plantService.createPlant(invalidPlant);
    await expect(plant).rejects.toThrow(CustomError);
    await expect(plant).rejects.toMatchObject({ code: 400 });
  });

  it('should throw error for empty plant name', async () => {
    const invalidPlant = { ...mockPlant, name: '' };

    const plant = plantService.createPlant(invalidPlant);
    await expect(plant).rejects.toThrow(CustomError);
    await expect(plant).rejects.toMatchObject({ code: 400 });
  });

  it('should throw error for existing plant name', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x.x',
    });

    (prisma.plant.create as jest.Mock).mockRejectedValue(prismaError);

    await expect(
      plantService.createPlant({
        name: 'Rose',
        sunlightLevel: SunlightLevel.FULL_SUN,
      }),
    ).rejects.toMatchObject({
      code: 409,
    });
  });

  it('should call prisma.plant.create with correct data', async () => {
    const createdPlant = {
      id: 1,
      name: 'Rose',
      sunlightLevel: SunlightLevel.FULL_SUN,
    };

    (prisma.plant.create as jest.Mock).mockResolvedValue(createdPlant);

    await plantService.createPlant({
      name: 'Rose',
      sunlightLevel: SunlightLevel.FULL_SUN,
    });

    expect(prisma.plant.create).toHaveBeenCalledWith({
      data: {
        name: 'Rose',
        sunlightLevel: SunlightLevel.FULL_SUN,
      },
    });
  });
});

describe('plantService.deletePlant', () => {
  const mockPlant: PlantDTO = { id: 1, name: 'Rose', sunlightLevel: SunlightLevel.FULL_SUN };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if plant does not exist', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record to delete does not exist.',
      { code: 'P2025', clientVersion: '5.x.x' },
    );

    (prisma.plant.delete as jest.Mock).mockRejectedValue(prismaError);

    await expect(plantService.deletePlant(1)).rejects.toMatchObject({ code: 404 });
  });

  it('should call prisma.plant.delete with correct id', async () => {
    const deletedPlant = {
      id: 1,
      name: 'Rose',
      sunlightLevel: SunlightLevel.FULL_SUN,
    };

    (prisma.plant.delete as jest.Mock).mockResolvedValue(deletedPlant);

    await plantService.deletePlant(1);

    expect(prisma.plant.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
