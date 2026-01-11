import { CustomError } from '../errors/CustomError';
import { SunlightLevel, UserRole } from '../generated/prisma/enums';
import { JwtPayload } from '../middleware/authHandler';
import { prisma } from '../prisma';
import { Prisma } from '../generated/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUserBody, LoginUserBody } from '../schemas';
import { utils } from '../utils/utils';
import { constants } from '../constants/constants';

type AuthTokens = { accessToken: string; refreshToken: string };

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

export interface UserPlantDetailsDTO {
  uid: string;
  userUid: string;
  plantUid: string;
  plantedAt: Date | null;
  lastWateredAt: Date | null;
  plant: {
    uid: string;
    name: string;
    sunlightLevel: SunlightLevel;
  };
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
 * Authenticate a user and return access + refresh tokens
 */
async function authenticateUser(user: LoginUserBody): Promise<AuthTokens> {
  const existingUser = await prisma.user.findUnique({
    where: { login: user.login },
  });
  const JWT_SECRET = process.env.JWT_SECRET;
  const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET;

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
  if (!REFRESH_JWT_SECRET) {
    throw new CustomError('Refresh JWT secret is not defined', 500);
  }

  const uid = utils.normalizeUid(existingUser.uid);

  const accessToken = jwt.sign(
    {
      uid,
      login: existingUser.login,
      role: existingUser.role,
      tokenType: constants.tokenTypes.access,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: constants.tokenExpiries.access },
  );

  const refreshToken = jwt.sign(
    {
      uid,
      login: existingUser.login,
      role: existingUser.role,
      tokenType: constants.tokenTypes.refresh,
    } satisfies JwtPayload,
    REFRESH_JWT_SECRET,
    { expiresIn: constants.tokenExpiries.refresh },
  );

  return { accessToken, refreshToken };
}

/**
 * Exchange a valid refresh token for new access + refresh tokens (stateless).
 */
async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const JWT_SECRET = process.env.JWT_SECRET;
  const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET;
  if (!JWT_SECRET) throw new CustomError('JWT secret is not defined', 500);
  if (!REFRESH_JWT_SECRET) throw new CustomError('Refresh JWT secret is not defined', 500);

  let decodedUnknown: unknown;
  try {
    decodedUnknown = jwt.verify(refreshToken, REFRESH_JWT_SECRET);
  } catch {
    throw new CustomError('Invalid refresh token', 401);
  }

  const isRefreshJwtPayload = (value: unknown): value is JwtPayload => {
    if (!utils.isRecord(value)) {
      return false;
    }

    return (
      value.tokenType === constants.tokenTypes.refresh &&
      utils.isString(value.uid) &&
      utils.isString(value.login) &&
      utils.isString(value.role)
    );
  };

  if (!isRefreshJwtPayload(decodedUnknown)) {
    throw new CustomError('Invalid refresh token', 401);
  }

  const decoded = decodedUnknown as JwtPayload;

  const uid = utils.normalizeUid(decoded.uid);

  // Re-check user state in DB (deleted user / role changes)
  const dbUser = await prisma.user.findUnique({
    where: { uid },
    select: { uid: true, login: true, role: true },
  });
  if (!dbUser) {
    // Treat as invalid refresh token to avoid user enumeration
    throw new CustomError('Invalid refresh token', 401);
  }

  const accessToken = jwt.sign(
    {
      uid,
      login: dbUser.login,
      role: dbUser.role,
      tokenType: constants.tokenTypes.access,
    } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: constants.tokenExpiries.access },
  );

  const newRefreshToken = jwt.sign(
    {
      uid,
      login: dbUser.login,
      role: dbUser.role,
      tokenType: constants.tokenTypes.refresh,
    } satisfies JwtPayload,
    REFRESH_JWT_SECRET,
    { expiresIn: constants.tokenExpiries.refresh },
  );

  return { accessToken, refreshToken: newRefreshToken };
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

async function listUserPlants(userUid: string): Promise<UserPlantDetailsDTO[]> {
  const normalizedUserUid = utils.normalizeUid(userUid);
  const userPlants = await prisma.userPlant.findMany({
    where: { userUid: normalizedUserUid },
    select: {
      uid: true,
      userUid: true,
      plantUid: true,
      plantedAt: true,
      lastWateredAt: true,
      plant: {
        select: {
          uid: true,
          name: true,
          sunlightLevel: true,
        },
      },
    },
  });

  return userPlants;
}

async function assertUserPlantOwnedByUser(params: {
  userUid: string;
  userPlantUid: string;
}): Promise<void> {
  const normalizedUserUid = utils.normalizeUid(params.userUid);
  const normalizedUserPlantUid = utils.normalizeUid(params.userPlantUid);

  const existing = await prisma.userPlant.findUnique({
    where: { uid: normalizedUserPlantUid },
    select: { userUid: true },
  });

  if (!existing || utils.normalizeUid(existing.userUid) !== normalizedUserUid) {
    // 404 to avoid leaking existence of other users' resources
    throw new CustomError('User plant not found', 404);
  }
}

async function updateUserPlant(params: {
  userUid: string;
  userPlantUid: string;
  plantedAt?: Date | null;
  lastWateredAt?: Date | null;
}): Promise<UserPlantDTO> {
  await assertUserPlantOwnedByUser({ userUid: params.userUid, userPlantUid: params.userPlantUid });

  const normalizedUserPlantUid = utils.normalizeUid(params.userPlantUid);

  const data: { plantedAt?: Date | null; lastWateredAt?: Date | null } = {};
  if (params.plantedAt !== undefined) data.plantedAt = params.plantedAt;
  if (params.lastWateredAt !== undefined) data.lastWateredAt = params.lastWateredAt;

  try {
    return await prisma.userPlant.update({
      where: { uid: normalizedUserPlantUid },
      data,
      select: {
        uid: true,
        userUid: true,
        plantUid: true,
        plantedAt: true,
        lastWateredAt: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new CustomError('User plant not found', 404);
    }
    throw error;
  }
}

async function deleteUserPlant(params: {
  userUid: string;
  userPlantUid: string;
}): Promise<UserPlantDTO> {
  await assertUserPlantOwnedByUser({ userUid: params.userUid, userPlantUid: params.userPlantUid });

  const normalizedUserPlantUid = utils.normalizeUid(params.userPlantUid);

  try {
    return await prisma.userPlant.delete({
      where: { uid: normalizedUserPlantUid },
      select: {
        uid: true,
        userUid: true,
        plantUid: true,
        plantedAt: true,
        lastWateredAt: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new CustomError('User plant not found', 404);
    }
    throw error;
  }
}

export const userService = {
  createUser,
  getUser,
  deleteUser,
  authenticateUser,
  refreshTokens,

  assignPlantToUser,
  listUserPlants,
  updateUserPlant,
  deleteUserPlant,
};
