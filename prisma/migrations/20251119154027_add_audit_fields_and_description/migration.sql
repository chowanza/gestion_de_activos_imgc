BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AsignacionesEquipos] ADD [usuarioId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Computador] ADD [descripcion] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[HistorialModificaciones] ADD [usuarioId] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HistorialModificaciones] ADD CONSTRAINT [HistorialModificaciones_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
