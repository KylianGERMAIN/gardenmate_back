import { Request } from 'express';
import { CustomError } from '../errors/CustomError';
import { SunlightLevel } from '../generated/prisma/enums';
import { prisma } from '../prisma';

export interface PlantDTO {
  id: number;
  name: string;
  sunlightLevel: SunlightLevel;
}

export interface GetPlantsParams {
  sunlightLevel?: string;
  name?: string;
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
async function getPlants(params: GetPlantsParams): Promise<PlantDTO[]> {
  const sunlightQuery = params.sunlightLevel;
  const nameQuery = params.name;

  checkSunlightLevel(sunlightQuery);

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

  return plants;
}

/**
 * Create a new plant
 */
async function createPlant(plant: PlantDTO): Promise<void> {
  const plantSunlight = plant.sunlightLevel;
  const plantName = plant.name;

  if (!plantSunlight) {
    throw new CustomError('Sunlight level is required', 400);
  }

  checkSunlightLevel(plantSunlight);

  if (!plantName || plantName.trim() === '') {
    throw new CustomError('Plant name cannot be empty', 400);
  }

  const existingPlant = await prisma.plant.findUnique({
    where: { name: plantName },
  });

  if (existingPlant) {
    throw new CustomError('Plant with this name already exists', 409);
  }

  await prisma.plant.create({
    data: {
      name: plantName,
      sunlightLevel: plantSunlight as SunlightLevel,
    },
  });
}

/**
 * Delete a plant by id
 */
async function deletePlant(plantId: number): Promise<void> {
  const existingPlant = await prisma.plant.findUnique({
    where: { id: plantId },
  });

  if (!existingPlant) {
    throw new CustomError('Plant not found', 404);
  }

  await prisma.plant.delete({
    where: { id: plantId },
  });
}

export const plantService = {
  getPlants,
  createPlant,
  deletePlant,
};
