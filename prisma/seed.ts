import { prisma } from '../src/prisma';
import { addPlants } from './plant';
import { addUser } from './user';

import 'dotenv/config';

async function main() {
  await addPlants();
  await addUser();
}

main().finally(async () => {
  await prisma.$disconnect();
});
