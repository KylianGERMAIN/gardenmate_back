import { CustomError } from '../errors/CustomError';
import { UserRole } from '../generated/prisma/enums';
import { JwtPayload } from '../middleware/authHandler';
import { prisma } from '../prisma';
import { Prisma } from '../generated/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUserBody, LoginUserBody } from '../schemas/user';
import { utils } from '../utils/uid';

export interface UserDTO {
  uid: string;
  login: string;
  role: UserRole;
}

export interface UserPlantDTO {
  uid?: string;
  userUid: string;
  plantUid: string;
  plantedAt?: Date | null;
  lastWateredAt?: Date | null;
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
      uid: true,
      login: true,
      role: true,
    },
  });
}

/**
 * Get a user by uid
 */
async function getUser(userUid: string): Promise<UserDTO> {
  const normalizedUid = utils.normalizeUid(userUid);
  const existingUser = await prisma.user.findUnique({
    where: { uid: normalizedUid },
    select: {
      uid: true,
      login: true,
      role: true,
    },
  });

  if (!existingUser) {
    throw new CustomError(`The user with uid '${userUid}' doesn't exist`, 404);
  }

  return existingUser;
}

/**
 * Delete a user by uid
 */
async function deleteUser(userUid: string): Promise<UserDTO> {
  const normalizedUid = utils.normalizeUid(userUid);
  try {
    const deletedUser = await prisma.user.delete({
      where: { uid: normalizedUid },
      select: { uid: true, login: true, role: true },
    });
    return deletedUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new CustomError(`The user with uid '${userUid}' doesn't exist`, 404);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new CustomError(
        `Cannot delete user uid='${userUid}' because it is linked to plants`,
        409,
      );
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
    { uid: existingUser.uid, login: existingUser.login, role: existingUser.role } as JwtPayload,
    JWT_SECRET,
    {
      expiresIn: '1h',
    },
  );
}

async function assignPlantToUser(userPlant: UserPlantDTO): Promise<UserPlantDTO> {
  try {
    return await prisma.userPlant.create({
      data: {
        userUid: utils.normalizeUid(userPlant.userUid),
        plantUid: utils.normalizeUid(userPlant.plantUid),
        plantedAt: userPlant.plantedAt,
        lastWateredAt: userPlant.lastWateredAt,
      },
      select: {
        uid: true,
        userUid: true,
        plantUid: true,
        plantedAt: true,
        lastWateredAt: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new CustomError(
        `Cannot assign plantUid=${userPlant.plantUid} to userUid=${userPlant.userUid}: related record does not exist`,
        400,
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new CustomError(`User or plant doesn't exist`, 404);
    }
    throw error;
  }
}

export const userService = {
  createUser,
  getUser,
  deleteUser,
  authenticateUser,

  assignPlantToUser,
};
