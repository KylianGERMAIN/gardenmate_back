import { CustomError } from '../errors/CustomError';
import { UserRole } from '../generated/prisma/enums';
import { JwtPayload } from '../middleware/auth';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

export interface LoginUserDTO {
  login: string;
  password: string;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Validate user input
 */
function validateUserInput(user: CreateUserDTO) {
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

/**
 * Create a new user
 */
async function createUser(user: CreateUserDTO) {
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

/**
 * Get a user by ID
 */
async function getUser(userId: number): Promise<GetUserDTO> {
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

/**
 * Delete a user by ID
 */
async function deleteUser(userId: number): Promise<GetUserDTO> {
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

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return existingUser;
}

/**
 * Delete a user by ID
 */
async function authenticateUser(user: LoginUserDTO): Promise<string> {
  if (!user.login || !user.password) {
    throw new CustomError('Login and password are required', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { login: user.login },
  });
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!existingUser) {
    throw new CustomError(`The user with login '${user.login}' doesn't exist`, 404);
  }

  const isPasswordValid = await bcrypt.compare(user.password, existingUser.password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid password', 401);
  }

  if (!JWT_SECRET) {
    throw new CustomError('JWT secret is not defined', 500);
  }

  return jwt.sign(
    { id: existingUser.id, login: existingUser.login, role: existingUser.role } as JwtPayload,
    JWT_SECRET,
    {
      expiresIn: '1h',
    },
  );
}

export const userService = {
  createUser,
  getUser,
  deleteUser,
  authenticateUser,
  validateUserInput,
};
