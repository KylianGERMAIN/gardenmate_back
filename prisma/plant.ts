import { prisma } from '../src/prisma';

export async function addPlants() {
  const plants = [
    { name: 'Carotte', sunlightLevel: 'plein soleil' },
    { name: 'Betterave', sunlightLevel: 'plein soleil' },
    { name: 'Navet', sunlightLevel: 'plein soleil' },
    { name: 'Radis', sunlightLevel: 'plein soleil' },
    { name: 'Panais', sunlightLevel: 'plein soleil' },
    { name: 'Laitue', sunlightLevel: 'mi-ombre' },
    { name: 'Épinard', sunlightLevel: 'mi-ombre' },
    { name: 'Chou frisé', sunlightLevel: 'mi-ombre' },
    { name: 'Roquette', sunlightLevel: 'plein soleil' },
    { name: 'Tomate', sunlightLevel: 'plein soleil' },
    { name: 'Poivron', sunlightLevel: 'plein soleil' },
    { name: 'Courgette', sunlightLevel: 'plein soleil' },
    { name: 'Concombre', sunlightLevel: 'plein soleil' },
    { name: 'Aubergine', sunlightLevel: 'plein soleil' },
    { name: 'Citrouille', sunlightLevel: 'plein soleil' },
    { name: 'Potiron', sunlightLevel: 'plein soleil' },
    { name: 'Oignon', sunlightLevel: 'plein soleil' },
    { name: 'Poireau', sunlightLevel: 'mi-ombre' },
    { name: 'Échalote', sunlightLevel: 'plein soleil' },
    { name: 'Ail', sunlightLevel: 'plein soleil' },
    { name: 'Haricot', sunlightLevel: 'plein soleil' },
    { name: 'Petit pois', sunlightLevel: 'plein soleil' },
    { name: 'Basilic', sunlightLevel: 'plein soleil' },
    { name: 'Persil', sunlightLevel: 'mi-ombre' },
    { name: 'Ciboulette', sunlightLevel: 'plein soleil' },
    { name: 'Thym', sunlightLevel: 'plein soleil' },
    { name: 'Romarin', sunlightLevel: 'plein soleil' },
  ];

  for (const plant of plants) {
    await prisma.plant.upsert({
      where: { name: plant.name },
      update: {},
      create: plant,
    });
  }
}
