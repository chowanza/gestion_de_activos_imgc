/*
  Warnings:

  - You are about to drop the column `almacenamientoMarca` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `almacenamientoModelo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `almacenamientoTipo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `certificaciones` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `dpn` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `equipo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ex` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `grafica` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `inputData` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `monitor` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ndAgrement` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `placaBase` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ramConfiguracion` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ramTipo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ramVelocidad` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `regModel` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `regTypeNo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `sapVersion` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `sede` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `st` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `unidadOptica` on the `Computador` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Computador] DROP COLUMN [almacenamientoMarca],
[almacenamientoModelo],
[almacenamientoTipo],
[certificaciones],
[dpn],
[equipo],
[ex],
[grafica],
[inputData],
[monitor],
[ndAgrement],
[placaBase],
[ramConfiguracion],
[ramTipo],
[ramVelocidad],
[regModel],
[regTypeNo],
[sapVersion],
[sede],
[st],
[telefono],
[unidadOptica];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
