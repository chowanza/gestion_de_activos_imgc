BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ModeloEquipo] DROP CONSTRAINT [ModeloEquipo_tipoEquipoId_fkey];

-- AddForeignKey
ALTER TABLE [dbo].[ModeloEquipo] ADD CONSTRAINT [ModeloEquipo_tipoEquipoId_fkey] FOREIGN KEY ([tipoEquipoId]) REFERENCES [dbo].[TipoEquipo]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
