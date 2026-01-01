-- CreateEnum
CREATE TYPE "SunlightLevel" AS ENUM ('FULL_SUN', 'PARTIAL_SHADE', 'SHADE');

ALTER TABLE plants
  ALTER COLUMN "sunlightLevel" TYPE "SunlightLevel"
  USING CASE
    WHEN "sunlightLevel" = 'FULL_SUN' THEN 'FULL_SUN'::"SunlightLevel"
    WHEN "sunlightLevel" = 'PARTIAL_SHADE' THEN 'PARTIAL_SHADE'::"SunlightLevel"
    WHEN "sunlightLevel" = 'SHADE' THEN 'SHADE'::"SunlightLevel"
  END;