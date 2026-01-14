/*
  Warnings:

  - You are about to drop the column `telefono` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cuit]` on the table `Jugador` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Jugador" ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "obraSocial" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "telefono";

-- CreateIndex
CREATE UNIQUE INDEX "Jugador_cuit_key" ON "Jugador"("cuit");
