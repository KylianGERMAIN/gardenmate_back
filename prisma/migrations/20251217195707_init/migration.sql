-- CreateTable
CREATE TABLE "Plant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sunlightLevel" TEXT NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);
