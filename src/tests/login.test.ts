import { prisma } from '../prisma';
import { CreateUserDTO, LoginUserDTO, userService } from '../service/user.service';
import { CustomError } from '../errors/CustomError';
import bcrypt from 'bcrypt';

describe('User service - login', () => {
  let testLogin: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_test';
  });

  beforeEach(() => {
    testLogin = `testuser_${Date.now()}`;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { login: testLogin } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a token for valid login', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'USER' };
    await userService.createUser(user);

    const loginDto: LoginUserDTO = { login: testLogin, password: 'Admin123*' };
    const token = await userService.authenticateUser(loginDto);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('should throw error for invalid password', async () => {
    const user: CreateUserDTO = { login: testLogin, password: 'Admin123*', role: 'USER' };
    await userService.createUser(user);

    const loginDto: LoginUserDTO = { login: testLogin, password: 'WrongPassword1!' };
    await expect(userService.authenticateUser(loginDto)).rejects.toThrow(CustomError);
  });

  it('should throw error if user does not exist', async () => {
    const loginDto: LoginUserDTO = { login: 'nonexistent', password: 'Admin123*' };
    await expect(userService.authenticateUser(loginDto)).rejects.toThrow(CustomError);
  });

  it('should throw error if login or password is missing', async () => {
    const loginDto: LoginUserDTO = { login: '', password: '' };
    await expect(userService.authenticateUser(loginDto)).rejects.toThrow(CustomError);
  });
});
