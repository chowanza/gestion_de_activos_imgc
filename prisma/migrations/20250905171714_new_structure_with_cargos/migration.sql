/*
  Warnings:

  - You are about to drop the column `ceco` on the `Departamento` table. All the data in the column will be lost.
  - You are about to drop the column `sociedad` on the `Departamento` table. All the data in the column will be lost.
  - You are about to drop the column `cargo` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `Configuracion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Gerencia` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cargoId` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Configuracion] DROP CONSTRAINT [Configuracion_gerenteGeneralId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Gerencia] DROP CONSTRAINT [Gerencia_gerenteId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Departamento] DROP COLUMN [ceco],
[sociedad];

-- AlterTable
ALTER TABLE [dbo].[Usuario] DROP COLUMN [cargo];
ALTER TABLE [dbo].[Usuario] ADD [cargoId] NVARCHAR(1000) NOT NULL;

-- DropTable
DROP TABLE [dbo].[Configuracion];

-- DropTable
DROP TABLE [dbo].[Gerencia];

-- CreateTable
CREATE TABLE [dbo].[Cargo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cargo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Cargo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Cargo] ADD CONSTRAINT [Cargo_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_cargoId_fkey] FOREIGN KEY ([cargoId]) REFERENCES [dbo].[Cargo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
