import { prisma } from '../prisma';
import { CreateUserDTO, userService } from '../service/user.service';
import { CustomError } from '../errors/CustomError';

describe('User service', () => {
  let testLogin: string;

  beforeEach(() => {
    testLogin = `testuser_${Date.now()}`;
  });

  afterEach(async () => {
    // Supprime l'utilisateur créé pour ne pas polluer la base
    await prisma.user.deleteMany({ where: { login: testLogin } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should throw error if login is missing', () => {
    const user: CreateUserDTO = { login: '', password: 'Admin123*', role: 'ADMIN' };
    expect(() => userService.validateUserInput(user)).toThrow('Login and password are required');
  });

  it('should throw error if password is missing', () => {
    const user: CreateUserDTO = { login: 'validlogin', password: '', role: 'ADMIN' };
    expect(() => userService.validateUserInput(user)).toThrow('Login and password are required');
  });

  it('should throw error if login is too short', () => {
    const user: CreateUserDTO = { login: 'abc', password: 'Admin123*', role: 'ADMIN' };
    expect(() => userService.validateUserInput(user)).toThrow(
      'Login must be at least 5 characters long',
    );
  });

  it('should throw error if password does not meet criteria', () => {
    const user: CreateUserDTO = { login: 'validlogin', password: 'password', role: 'ADMIN' };
    expect(() => userService.validateUserInput(user)).toThrow(
      'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character',
    );
  });

  it('should hash password and create user', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'ADMIN' };
    await userService.createUser(user);

    const dbUser = await prisma.user.findUnique({ where: { login: testLogin } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.login).toBe(testLogin);
    expect(dbUser?.password).not.toBe('Admin123*'); // Vérifie que le mot de passe est hashé
  });

  it('should throw error if user already exists', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'ADMIN' };
    await userService.createUser(user);

    await expect(userService.createUser(user)).rejects.toThrow(CustomError);
  });

  it('should return user if it exists', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'USER' };
    await userService.createUser(user);

    const dbUser = await prisma.user.findUnique({ where: { login: testLogin } });
    expect(dbUser).not.toBeNull();

    const result = await userService.getUser(dbUser!.id);

    expect(result).toEqual({
      id: dbUser!.id,
      login: testLogin,
      role: 'USER',
    });
  });

  it('should throw CustomError if user does not exist', async () => {
    await expect(userService.getUser(999999)).rejects.toThrow(CustomError);
    await expect(userService.getUser(999999)).rejects.toMatchObject({
      code: 404,
    });
  });

  it('should delete an existing user', async () => {
    // Créer un utilisateur test
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'USER' };
    await userService.createUser(user);

    const dbUser = await prisma.user.findUnique({ where: { login: testLogin } });
    expect(dbUser).not.toBeNull();

    // Supprimer l'utilisateur
    const deletedUser = await userService.deleteUser(dbUser!.id);

    // Vérifier que le delete retourne l'utilisateur supprimé
    expect(deletedUser.id).toBe(dbUser!.id);
    expect(deletedUser.login).toBe(testLogin);

    // Vérifier que l'utilisateur n'existe plus en base
    const checkDb = await prisma.user.findUnique({ where: { id: dbUser!.id } });
    expect(checkDb).toBeNull();
  });

  it('should throw CustomError if deleting non-existent user', async () => {
    await expect(userService.deleteUser(999999)).rejects.toThrow(CustomError);
    await expect(userService.deleteUser(999999)).rejects.toMatchObject({
      code: 404,
    });
  });
});
