BEGIN TRY

BEGIN TRAN;

-- Add nullable column tipoEquipoId to ModeloEquipo
ALTER TABLE [dbo].[ModeloEquipo]
ADD [tipoEquipoId] NVARCHAR(1000) NULL;

-- Create index for faster lookups
CREATE INDEX [ModeloEquipo_tipoEquipoId_idx] ON [dbo].[ModeloEquipo]([tipoEquipoId]);

-- Add foreign key constraint to TipoEquipo(id)
ALTER TABLE [dbo].[ModeloEquipo]
ADD CONSTRAINT [ModeloEquipo_tipoEquipoId_fkey]
FOREIGN KEY ([tipoEquipoId]) REFERENCES [dbo].[TipoEquipo]([id])
ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
