import { SunlightLevel } from '../src/generated/prisma/enums';
import { prisma } from '../src/prisma';

export async function addPlants() {
  const plants = [
    { name: 'Carrot', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Beetroot', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Turnip', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Radish', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Parsnip', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Lettuce', sunlightLevel: SunlightLevel.PARTIAL_SHADE },
    { name: 'Spinach', sunlightLevel: SunlightLevel.PARTIAL_SHADE },
    { name: 'Kale', sunlightLevel: SunlightLevel.PARTIAL_SHADE },
    { name: 'Rocket', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Tomato', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Bell Pepper', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Zucchini', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Cucumber', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Eggplant', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Pumpkin', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Squash', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Onion', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Leek', sunlightLevel: SunlightLevel.PARTIAL_SHADE },
    { name: 'Shallot', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Garlic', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Bean', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Pea', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Basil', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Parsley', sunlightLevel: SunlightLevel.PARTIAL_SHADE },
    { name: 'Chives', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Thyme', sunlightLevel: SunlightLevel.FULL_SUN },
    { name: 'Rosemary', sunlightLevel: SunlightLevel.FULL_SUN },
  ];

  for (const plant of plants) {
    await prisma.plant.upsert({
      where: { name: plant.name },
      update: {},
      create: plant,
    });
  }
}
