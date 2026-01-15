import { SunlightLevel } from '../src/generated/prisma/enums';
import { prisma } from '../src/prisma';

export async function addPlants() {
  const plants = [
    { name: 'Carrot', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Beetroot', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Turnip', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 4 },
    { name: 'Radish', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Parsnip', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 5 },
    { name: 'Lettuce', sunlightLevel: SunlightLevel.PARTIAL_SHADE, wateringFrequency: 2 },
    { name: 'Spinach', sunlightLevel: SunlightLevel.PARTIAL_SHADE, wateringFrequency: 2 },
    { name: 'Kale', sunlightLevel: SunlightLevel.PARTIAL_SHADE, wateringFrequency: 3 },
    { name: 'Rocket', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Tomato', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 2 },
    { name: 'Bell Pepper', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Zucchini', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 4 },
    { name: 'Cucumber', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Eggplant', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Pumpkin', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 5 },
    { name: 'Squash', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 5 },
    { name: 'Onion', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 4 },
    { name: 'Leek', sunlightLevel: SunlightLevel.PARTIAL_SHADE, wateringFrequency: 4 },
    { name: 'Shallot', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 4 },
    { name: 'Garlic', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 4 },
    { name: 'Bean', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Pea', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 3 },
    { name: 'Basil', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 2 },
    { name: 'Parsley', sunlightLevel: SunlightLevel.PARTIAL_SHADE, wateringFrequency: 2 },
    { name: 'Chives', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 2 },
    { name: 'Thyme', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 4 },
    { name: 'Rosemary', sunlightLevel: SunlightLevel.FULL_SUN, wateringFrequency: 5 },
  ];

  for (const plant of plants) {
    await prisma.plant.upsert({
      where: { name: plant.name },
      update: {},
      create: plant,
    });
  }
}
