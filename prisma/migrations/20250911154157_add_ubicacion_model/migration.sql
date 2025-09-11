/*
  Warnings:

  - You are about to drop the column `ubicacion` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `Dispositivo` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Computador] DROP COLUMN [ubicacion];
ALTER TABLE [dbo].[Computador] ADD [ubicacionId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Dispositivo] DROP COLUMN [ubicacion];
ALTER TABLE [dbo].[Dispositivo] ADD [ubicacionId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[Ubicacion] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [direccion] NVARCHAR(1000),
    [piso] NVARCHAR(1000),
    [sala] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ubicacion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Ubicacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Ubicacion_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- AddForeignKey
ALTER TABLE [dbo].[Computador] ADD CONSTRAINT [Computador_ubicacionId_fkey] FOREIGN KEY ([ubicacionId]) REFERENCES [dbo].[Ubicacion]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Dispositivo] ADD CONSTRAINT [Dispositivo_ubicacionId_fkey] FOREIGN KEY ([ubicacionId]) REFERENCES [dbo].[Ubicacion]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
