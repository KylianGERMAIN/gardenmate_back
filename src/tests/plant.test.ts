import { plantService, PlantDTO, GetPlantsParams } from '../service/plant.service';
import { prisma } from '../prisma';
import { CustomError } from '../errors/CustomError';
import { SunlightLevel } from '../generated/prisma/enums';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
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
    const params: GetPlantsParams = {
      sunlightLevel: 'INVALID',
    };

    await expect(plantService.getPlants(params)).rejects.toThrow(CustomError);
    await expect(plantService.getPlants(params)).rejects.toMatchObject({ code: 400 });
  });

  it('should call prisma.plant.findMany with correct sunlightLevel', async () => {
    const params: GetPlantsParams = {
      sunlightLevel: 'FULL_SUN',
    };
    (prisma.plant.findMany as jest.Mock).mockResolvedValue([mockPlants[0]]);

    const result = await plantService.getPlants(params);

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

    const result = await plantService.getPlants(params);

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

    await expect(plantService.createPlant(invalidPlant)).rejects.toThrow(CustomError);
    await expect(plantService.createPlant(invalidPlant)).rejects.toMatchObject({ code: 400 });
  });

  it('should throw error for empty plant name', async () => {
    const invalidPlant = { ...mockPlant, name: '' };

    await expect(plantService.createPlant(invalidPlant)).rejects.toThrow(CustomError);
    await expect(plantService.createPlant(invalidPlant)).rejects.toMatchObject({ code: 400 });
  });

  it('should throw error for existing plant name', async () => {
    (prisma.plant.findUnique as jest.Mock).mockResolvedValue(mockPlant);

    await expect(plantService.createPlant(mockPlant)).rejects.toThrow(CustomError);
    await expect(plantService.createPlant(mockPlant)).rejects.toMatchObject({ code: 409 });
  });

  it('should call prisma.plant.create with correct data', async () => {
    (prisma.plant.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.plant.create as jest.Mock).mockResolvedValue(undefined);

    await plantService.createPlant(mockPlant);

    expect(prisma.plant.create).toHaveBeenCalledWith({
      data: {
        name: 'Rose',
        sunlightLevel: SunlightLevel.FULL_SUN,
      },
    });
  });
});
