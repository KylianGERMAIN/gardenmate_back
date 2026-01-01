-- CreateTable
CREATE TABLE "plants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sunlightLevel" TEXT NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plants_name_key" ON "plants"("name");