import { prisma } from '../prisma';
import { CreateUserDTO, createUser, validateUserInput } from '../service/user.service';
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
    expect(() => validateUserInput(user)).toThrow('Login and password are required');
  });

  it('should throw error if password is missing', () => {
    const user: CreateUserDTO = { login: 'validlogin', password: '', role: 'ADMIN' };
    expect(() => validateUserInput(user)).toThrow('Login and password are required');
  });

  it('should throw error if login is too short', () => {
    const user: CreateUserDTO = { login: 'abc', password: 'Admin123*', role: 'ADMIN' };
    expect(() => validateUserInput(user)).toThrow('Login must be at least 5 characters long');
  });

  it('should throw error if password does not meet criteria', () => {
    const user: CreateUserDTO = { login: 'validlogin', password: 'password', role: 'ADMIN' };
    expect(() => validateUserInput(user)).toThrow(
      'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character',
    );
  });

  it('should hash password and create user', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'ADMIN' };
    await createUser(user);

    const dbUser = await prisma.user.findUnique({ where: { login: testLogin } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.login).toBe(testLogin);
    expect(dbUser?.password).not.toBe('Admin123*'); // Vérifie que le mot de passe est hashé
  });

  it('should throw error if user already exists', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'ADMIN' };
    await createUser(user);

    await expect(createUser(user)).rejects.toThrow(CustomError);
  });
});
