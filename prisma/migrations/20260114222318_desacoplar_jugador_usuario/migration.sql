/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `Jugador` table. All the data in the column will be lost.
  - Added the required column `nombre` to the `Jugador` table without a default value. This is not possible if the table is not empty.

*/

-- Primero, guardar la relación usuario-jugador existente para restaurarla
-- y copiar el nombre del usuario al jugador

-- 1. Agregar columna nombre con valor por defecto temporal
ALTER TABLE "Jugador" ADD COLUMN "nombre" TEXT NOT NULL DEFAULT 'Sin nombre';
ALTER TABLE "Jugador" ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

-- 2. Actualizar nombre del jugador con el nombre del usuario relacionado
UPDATE "Jugador" j
SET "nombre" = u."nombreCompleto"
FROM "Usuario" u
WHERE j."usuarioId" = u."id";

-- 3. Quitar el default ya que ahora tiene datos
ALTER TABLE "Jugador" ALTER COLUMN "nombre" DROP DEFAULT;

-- 4. Agregar columna jugadorId a Usuario
ALTER TABLE "Usuario" ADD COLUMN "jugadorId" TEXT;

-- 5. Actualizar la relación inversa: ahora Usuario apunta a Jugador
UPDATE "Usuario" u
SET "jugadorId" = j."id"
FROM "Jugador" j
WHERE j."usuarioId" = u."id";

-- 6. Ahora podemos eliminar la foreign key y columna vieja
ALTER TABLE "Jugador" DROP CONSTRAINT IF EXISTS "Jugador_usuarioId_fkey";
DROP INDEX IF EXISTS "Jugador_usuarioId_key";
ALTER TABLE "Jugador" DROP COLUMN IF EXISTS "usuarioId";

-- 7. Agregar la nueva foreign key
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_jugadorId_fkey" FOREIGN KEY ("jugadorId") REFERENCES "Jugador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
