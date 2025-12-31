import { Request } from 'express';
import { CustomError } from '../errors/CustomError';
import { SunlightLevel } from '../generated/prisma/enums';
import { prisma } from '../prisma';

export interface PlantDTO {
  id: number;
  name: string;
  sunlightLevel: SunlightLevel;
}

async function getPlants(req: Request): Promise<PlantDTO[]> {
  const sunlightQuery = req.query.sunlightLevel as SunlightLevel | undefined;

  if (sunlightQuery && !Object.values(SunlightLevel).some((value) => value === sunlightQuery)) {
    throw new CustomError('Invalid sunlightLevel', 400);
  }
  const plants = await prisma.plant.findMany({
    where: { sunlightLevel: sunlightQuery as SunlightLevel },
  });

  return plants;
}

export const plantService = {
  getPlants,
};
