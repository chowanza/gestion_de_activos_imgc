/*
  Warnings:

  - You are about to drop the column `gerenciaId` on the `Departamento` table. All the data in the column will be lost.
  - Added the required column `empresaId` to the `Departamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Departamento` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Departamento] DROP CONSTRAINT [Departamento_gerenciaId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Computador] ADD [almacenamientoMarca] NVARCHAR(1000),
[almacenamientoModelo] NVARCHAR(1000),
[almacenamientoTipo] NVARCHAR(1000),
[certificaciones] NVARCHAR(1000),
[dpn] NVARCHAR(1000),
[equipo] NVARCHAR(1000),
[ex] NVARCHAR(1000),
[grafica] NVARCHAR(1000),
[inputData] NVARCHAR(1000),
[monitor] NVARCHAR(1000),
[ndAgrement] NVARCHAR(1000),
[placaBase] NVARCHAR(1000),
[ramConfiguracion] NVARCHAR(1000),
[ramTipo] NVARCHAR(1000),
[ramVelocidad] NVARCHAR(1000),
[regModel] NVARCHAR(1000),
[regTypeNo] NVARCHAR(1000),
[st] NVARCHAR(1000),
[telefono] NVARCHAR(1000),
[unidadOptica] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Departamento] DROP COLUMN [gerenciaId];
ALTER TABLE [dbo].[Departamento] ADD [createdAt] DATETIME2 NOT NULL CONSTRAINT [Departamento_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
[empresaId] NVARCHAR(1000) NOT NULL,
[updatedAt] DATETIME2 NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[Empresa] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Empresa_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Empresa_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Empresa_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[HistorialMovimientos] (
    [id] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL CONSTRAINT [HistorialMovimientos_fecha_df] DEFAULT CURRENT_TIMESTAMP,
    [accion] NVARCHAR(1000) NOT NULL,
    [entidad] NVARCHAR(1000) NOT NULL,
    [entidadId] NVARCHAR(1000),
    [descripcion] NVARCHAR(1000) NOT NULL,
    [detalles] NVARCHAR(1000),
    [usuarioId] NVARCHAR(1000),
    [ipAddress] NVARCHAR(1000),
    [userAgent] NVARCHAR(1000),
    CONSTRAINT [HistorialMovimientos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_fecha_idx] ON [dbo].[HistorialMovimientos]([fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_accion_idx] ON [dbo].[HistorialMovimientos]([accion]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_entidad_idx] ON [dbo].[HistorialMovimientos]([entidad]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_usuarioId_idx] ON [dbo].[HistorialMovimientos]([usuarioId]);

-- AddForeignKey
ALTER TABLE [dbo].[Departamento] ADD CONSTRAINT [Departamento_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HistorialMovimientos] ADD CONSTRAINT [HistorialMovimientos_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
