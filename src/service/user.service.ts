import { CustomError } from '../errors/CustomError';
import { UserRole } from '../generated/prisma/enums';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';

export interface CreateUserDTO {
  login: string;
  password: string;
  role: UserRole;
}

export interface GetUserDTO {
  id: number;
  login: string;
  role: UserRole;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function validateUserInput(user: CreateUserDTO) {
  if (!user.login || !user.password) {
    throw new CustomError('Login and password are required');
  }
  if (user.login.length < 5) {
    throw new CustomError('Login must be at least 5 characters long');
  }
  if (!PASSWORD_REGEX.test(user.password)) {
    throw new CustomError(
      'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character',
    );
  }
}

export async function createUser(user: CreateUserDTO) {
  validateUserInput(user);

  const existingUser = await prisma.user.findUnique({
    where: { login: user.login },
  });

  if (existingUser) {
    throw new CustomError(`User with login '${user.login}' already exists`, 409);
  }

  const password = await bcrypt.hash(user.password, 10);

  await prisma.user.create({
    data: {
      login: user.login,
      password: password,
      role: 'USER',
    },
  });
}

export async function getUser(userId: number): Promise<GetUserDTO> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      login: true,
      role: true,
    },
  });

  if (!existingUser) {
    throw new CustomError(`The user with id '${userId}' doesn't exist`, 404);
  }

  return existingUser;
}
