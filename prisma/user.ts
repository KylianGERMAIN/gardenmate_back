import { UserRole } from '../src/generated/prisma/enums';
import { prisma } from '../src/prisma';

export async function addUser() {
  const users = [
    {
      login: 'admin',
      password: '$2b$10$R/fjJ9YPk/Ne1eAo/NNZ5.tQt1oYp4Ho9A5TzhXEOqAKDkS.Nuk3i', // Admin123*
      role: UserRole.ADMIN,
    },
    {
      login: 'user',
      password: '$2b$10$X2XYWC02TK88J3NU0udbxOjxNMyx4P5O8y8/516jGfya0Re6szUaK', // User123*
      role: UserRole.USER,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { login: user.login },
      update: {},
      create: user,
    });
  }
}
