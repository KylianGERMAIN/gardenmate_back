import { CustomError } from '../errors/CustomError';
import { SunlightLevel } from '../generated/prisma/enums';
import { prisma } from '../prisma';
import { Plant, Prisma } from '../generated/prisma/client';

export interface PlantDTO {
  id: number;
  name: string;
  sunlightLevel: SunlightLevel;
}

export interface CreatePlantDTO {
  name: string;
  sunlightLevel: SunlightLevel;
}

export interface GetPlantsParams {
  sunlightLevel?: string;
  name?: string;
}

/**
 * Map plant model to PlantDTO
 */
function mapToPlantDTO(plant: Plant): PlantDTO {
  return {
    id: plant.id,
    name: plant.name,
    sunlightLevel: plant.sunlightLevel,
  };
}

/**
 * Check if sunlightLevel is valid
 */
function checkSunlightLevel(sunlightLevel: string | undefined): void {
  if (sunlightLevel && !Object.values(SunlightLevel).includes(sunlightLevel as SunlightLevel)) {
    throw new CustomError('Invalid sunlightLevel', 400);
  }
}

/**
 * Get plants with optional filters
 */
async function findPlants(params: GetPlantsParams): Promise<PlantDTO[]> {
  const sunlightQuery = params.sunlightLevel;
  const nameQuery = params.name;

  checkSunlightLevel(sunlightQuery as string);

  const plants = await prisma.plant.findMany({
    where: {
      ...(sunlightQuery && { sunlightLevel: sunlightQuery as SunlightLevel }),
      ...(nameQuery && {
        name: {
          contains: nameQuery,
          mode: 'insensitive',
        },
      }),
    },
  });

  return plants.map(mapToPlantDTO);
}

/**
 * Create a new plant
 */
async function createPlant({ name, sunlightLevel }: CreatePlantDTO): Promise<PlantDTO> {
  if (!sunlightLevel) throw new CustomError('Sunlight level is required', 400);
  if (!name?.trim()) throw new CustomError('Plant name cannot be empty', 400);
  checkSunlightLevel(sunlightLevel as string);

  try {
    const newPlant = await prisma.plant.create({ data: { name, sunlightLevel } });
    return mapToPlantDTO(newPlant);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new CustomError('Plant with this name already exists', 409);
    }
    throw error;
  }
}

/**
 * Delete a plant by id
 */
async function deletePlant(plantId: number): Promise<PlantDTO> {
  try {
    const deletedPlant = await prisma.plant.delete({ where: { id: plantId } });
    return mapToPlantDTO(deletedPlant);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new CustomError('Plant not found', 404);
    }
    throw error;
  }
}

export const plantService = {
  checkSunlightLevel,
  findPlants,
  createPlant,
  deletePlant,
};
