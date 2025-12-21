import { prisma } from '../src/prisma';

export async function addUser() {
  const users = [
    { login: 'admin', password: 'admin', role: 'ADMIN' },
    { login: 'user', password: '123456', role: 'USER' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { login: user.login },
      update: {},
      create: user,
    });
  }
}
