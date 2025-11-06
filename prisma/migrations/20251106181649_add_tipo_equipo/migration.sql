BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[TipoEquipo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [categoria] NVARCHAR(1000) NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [TipoEquipo_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TipoEquipo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TipoEquipo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TipoEquipo_categoria_nombre_key] UNIQUE NONCLUSTERED ([categoria],[nombre])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
