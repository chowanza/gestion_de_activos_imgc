/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `IntervencionesEquipos` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] DROP CONSTRAINT [IntervencionesEquipos_usuarioId_fkey];

-- AlterTable
ALTER TABLE [dbo].[IntervencionesEquipos] DROP COLUMN [usuarioId];
ALTER TABLE [dbo].[IntervencionesEquipos] ADD [empleadoId] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_empleadoId_idx] ON [dbo].[IntervencionesEquipos]([empleadoId]);

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
