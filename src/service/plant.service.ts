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

async function getPlants(params: GetPlantsParams): Promise<PlantDTO[]> {
  const sunlightQuery = params.sunlightLevel;
  const nameQuery = params.name;

  if (sunlightQuery && !Object.values(SunlightLevel).some((value) => value === sunlightQuery)) {
    throw new CustomError('Invalid sunlightLevel', 400);
  }
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

export const plantService = {
  getPlants,
};
