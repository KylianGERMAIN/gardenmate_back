import { CustomError } from '../errors/CustomError';
import { SunlightLevel } from '../generated/prisma/enums';
import { prisma } from '../prisma';
import { Plant, Prisma } from '../generated/prisma/client';
import { PlantCreateBody, PlantGetQuery } from '../schemas/plant';

export interface PlantDTO {
  id: number;
  name: string;
  sunlightLevel: SunlightLevel;
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
 * Get plants with optional filters
 */
async function findPlants(params: PlantGetQuery): Promise<PlantDTO[]> {
  const sunlightQuery = params.sunlightLevel;
  const nameQuery = params.name;

  const plants = await prisma.plant.findMany({
    where: {
      ...(sunlightQuery && { sunlightLevel: sunlightQuery }),
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
async function createPlant({ name, sunlightLevel }: PlantCreateBody): Promise<PlantDTO> {
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new CustomError(
        `Cannot delete plant id='${plantId}' because it is assigned to users`,
        409,
      );
    }
    throw error;
  }
}

export const plantService = {
  findPlants,
  createPlant,
  deletePlant,
};
