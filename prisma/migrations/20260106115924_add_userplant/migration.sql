-- CreateTable
CREATE TABLE "user_plants" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "plantId" INTEGER NOT NULL,
    "plantedAt" TIMESTAMP(3),
    "lastWateredAt" TIMESTAMP(3),

    CONSTRAINT "user_plants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plants" ADD CONSTRAINT "user_plants_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
