import { plantService, PlantDTO } from '../service/plant.service';
import { prisma } from '../prisma';
import { CustomError } from '../errors/CustomError';
import { Request } from 'express';
import { SunlightLevel } from '../generated/prisma/enums';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    plant: {
      findMany: jest.fn(),
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
    const req = { query: { sunlightLevel: 'INVALID' } } as unknown as Request;

    await expect(plantService.getPlants(req)).rejects.toThrow(CustomError);
    await expect(plantService.getPlants(req)).rejects.toMatchObject({ code: 400 });
  });

  it('should call prisma.plant.findMany with correct sunlightLevel', async () => {
    const req = { query: { sunlightLevel: 'FULL_SUN' } } as unknown as Request;
    (prisma.plant.findMany as jest.Mock).mockResolvedValue([mockPlants[0]]);

    const result = await plantService.getPlants(req);

    expect(prisma.plant.findMany).toHaveBeenCalledWith({
      where: { sunlightLevel: SunlightLevel.FULL_SUN },
    });
    expect(result).toEqual([mockPlants[0]]);
  });
});
