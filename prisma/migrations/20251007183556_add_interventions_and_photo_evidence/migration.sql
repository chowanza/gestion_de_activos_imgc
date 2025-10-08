BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[AsignacionesEquipos] ADD [evidenciaFotos] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[IntervencionesEquipos] (
    [id] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL CONSTRAINT [IntervencionesEquipos_fecha_df] DEFAULT CURRENT_TIMESTAMP,
    [notas] NVARCHAR(1000),
    [evidenciaFotos] NVARCHAR(1000),
    [computadorId] NVARCHAR(1000),
    [dispositivoId] NVARCHAR(1000),
    [usuarioId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [IntervencionesEquipos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [IntervencionesEquipos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_fecha_idx] ON [dbo].[IntervencionesEquipos]([fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_computadorId_idx] ON [dbo].[IntervencionesEquipos]([computadorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_dispositivoId_idx] ON [dbo].[IntervencionesEquipos]([dispositivoId]);

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
