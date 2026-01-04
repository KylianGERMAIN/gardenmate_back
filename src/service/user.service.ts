import { CustomError } from '../errors/CustomError';
import { UserRole } from '../generated/prisma/enums';
import { JwtPayload } from '../middleware/authHandler';
import { prisma } from '../prisma';
import { Prisma } from '../generated/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUserBody, LoginUserBody } from '../schemas/user';

export interface UserDTO {
  id: number;
  login: string;
  role: UserRole;
}

/**
 * Create a new user
 */
async function createUser(user: CreateUserBody): Promise<UserDTO> {
  const existingUser = await prisma.user.findUnique({
    where: { login: user.login },
  });

  if (existingUser) {
    throw new CustomError(`User with login '${user.login}' already exists`, 409);
  }

  const password = await bcrypt.hash(user.password, 10);

  return await prisma.user.create({
    data: {
      login: user.login,
      password: password,
      role: 'USER',
    },
    select: {
      id: true,
      login: true,
      role: true,
    },
  });
}

/**
 * Get a user by ID
 */
async function getUser(userId: number): Promise<UserDTO> {
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
async function deleteUser(userId: number): Promise<UserDTO> {
  try {
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
      select: { id: true, login: true, role: true },
    });
    return deletedUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new CustomError(`The user with id '${userId}' doesn't exist`, 404);
    }
    throw error;
  }
}

/**
 * Authenticate a user and return a JWT
 */
async function authenticateUser(user: LoginUserBody): Promise<string> {
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
};
