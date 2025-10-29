/*
  Warnings:

  - You are about to drop the column `targetUsuarioId` on the `Asignaciones` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `Dispositivo` table. All the data in the column will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_gerenteId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_targetUsuarioId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Computador] DROP CONSTRAINT [Computador_usuarioId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Dispositivo] DROP CONSTRAINT [Dispositivo_usuarioId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Usuario] DROP CONSTRAINT [Usuario_cargoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Usuario] DROP CONSTRAINT [Usuario_departamentoId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Asignaciones] DROP COLUMN [targetUsuarioId];
ALTER TABLE [dbo].[Asignaciones] ADD [targetEmpleadoId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Computador] DROP COLUMN [usuarioId];
ALTER TABLE [dbo].[Computador] ADD [empleadoId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Departamento] ADD [gerenteId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Dispositivo] DROP COLUMN [usuarioId];
ALTER TABLE [dbo].[Dispositivo] ADD [empleadoId] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Empresa] ADD [logo] NVARCHAR(1000);

-- DropTable
DROP TABLE [dbo].[Usuario];

-- CreateTable
CREATE TABLE [dbo].[Empleado] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [ced] NVARCHAR(1000) NOT NULL,
    [fechaNacimiento] NVARCHAR(1000),
    [fechaIngreso] NVARCHAR(1000),
    [fechaDesincorporacion] NVARCHAR(1000),
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [cargoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Empleado_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Departamento] ADD CONSTRAINT [Departamento_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Empleado] ADD CONSTRAINT [Empleado_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Empleado] ADD CONSTRAINT [Empleado_cargoId_fkey] FOREIGN KEY ([cargoId]) REFERENCES [dbo].[Cargo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Computador] ADD CONSTRAINT [Computador_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Dispositivo] ADD CONSTRAINT [Dispositivo_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_targetEmpleadoId_fkey] FOREIGN KEY ([targetEmpleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
