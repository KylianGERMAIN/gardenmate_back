-- Migration: use native Postgres UUID columns (uid first) + DB-side UUID generation.
-- NOTE: This is destructive (drops tables). Use only for fresh DB / reset environments.

BEGIN;

-- Ensure UUID generation is available (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop child table first (foreign keys)
DROP TABLE IF EXISTS "user_plants";
DROP TABLE IF EXISTS "plants";
DROP TABLE IF EXISTS "users";

-- plants
CREATE TABLE "plants" (
  "uid" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "sunlightLevel" "SunlightLevel" NOT NULL,

  CONSTRAINT "plants_pkey" PRIMARY KEY ("uid")
);

CREATE UNIQUE INDEX "plants_name_key" ON "plants" ("name");

-- users
CREATE TABLE "users" (
  "uid" UUID NOT NULL DEFAULT gen_random_uuid(),
  "login" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("uid")
);

CREATE UNIQUE INDEX "users_login_key" ON "users" ("login");

-- user_plants
CREATE TABLE "user_plants" (
  "uid" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userUid" UUID NOT NULL,
  "plantUid" UUID NOT NULL,
  "plantedAt" TIMESTAMP(3),
  "lastWateredAt" TIMESTAMP(3),

  CONSTRAINT "user_plants_pkey" PRIMARY KEY ("uid")
);

ALTER TABLE "user_plants"
  ADD CONSTRAINT "user_plants_userUid_fkey"
  FOREIGN KEY ("userUid") REFERENCES "users" ("uid")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "user_plants"
  ADD CONSTRAINT "user_plants_plantUid_fkey"
  FOREIGN KEY ("plantUid") REFERENCES "plants" ("uid")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

COMMIT;
