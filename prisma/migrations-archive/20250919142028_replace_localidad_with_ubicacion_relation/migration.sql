/*
  Warnings:

  - You are about to drop the column `localidad` on the `Asignaciones` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Asignaciones] DROP COLUMN [localidad];
ALTER TABLE [dbo].[Asignaciones] ADD [ubicacionId] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_ubicacionId_fkey] FOREIGN KEY ([ubicacionId]) REFERENCES [dbo].[Ubicacion]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
