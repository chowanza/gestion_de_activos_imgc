/*
  Warnings:

  - You are about to drop the column `departamentoId` on the `Cargo` table. All the data in the column will be lost.
  - You are about to drop the column `departamentoId` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `empleadoId` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `modeloId` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacionId` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `empresaId` on the `Departamento` table. All the data in the column will be lost.
  - You are about to drop the column `gerenteId` on the `Departamento` table. All the data in the column will be lost.
  - You are about to drop the column `departamentoId` on the `Dispositivo` table. All the data in the column will be lost.
  - You are about to drop the column `empleadoId` on the `Dispositivo` table. All the data in the column will be lost.
  - You are about to drop the column `modeloId` on the `Dispositivo` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacionId` on the `Dispositivo` table. All the data in the column will be lost.
  - You are about to drop the column `cargoId` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `departamentoId` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the `Asignaciones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModeloDispositivo` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_computadorId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_dispositivoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_gerenteId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_targetDepartamentoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_targetEmpleadoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Asignaciones] DROP CONSTRAINT [Asignaciones_ubicacionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Cargo] DROP CONSTRAINT [Cargo_departamentoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Computador] DROP CONSTRAINT [Computador_departamentoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Computador] DROP CONSTRAINT [Computador_empleadoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Computador] DROP CONSTRAINT [Computador_modeloId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Computador] DROP CONSTRAINT [Computador_ubicacionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Departamento] DROP CONSTRAINT [Departamento_empresaId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Departamento] DROP CONSTRAINT [Departamento_gerenteId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Dispositivo] DROP CONSTRAINT [Dispositivo_departamentoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Dispositivo] DROP CONSTRAINT [Dispositivo_empleadoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Dispositivo] DROP CONSTRAINT [Dispositivo_modeloId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Dispositivo] DROP CONSTRAINT [Dispositivo_ubicacionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Empleado] DROP CONSTRAINT [Empleado_cargoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Empleado] DROP CONSTRAINT [Empleado_departamentoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[ModeloDispositivo] DROP CONSTRAINT [ModeloDispositivo_marcaId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Cargo] DROP COLUMN [departamentoId];

-- AlterTable
ALTER TABLE [dbo].[Computador] DROP COLUMN [departamentoId],
[empleadoId],
[modeloId],
[ubicacionId];
ALTER TABLE [dbo].[Computador] ADD CONSTRAINT [Computador_estado_df] DEFAULT 'OPERATIVO' FOR [estado];

-- AlterTable
ALTER TABLE [dbo].[Departamento] DROP COLUMN [empresaId],
[gerenteId];

-- AlterTable
ALTER TABLE [dbo].[Dispositivo] DROP COLUMN [departamentoId],
[empleadoId],
[modeloId],
[ubicacionId];
ALTER TABLE [dbo].[Dispositivo] ADD CONSTRAINT [Dispositivo_estado_df] DEFAULT 'OPERATIVO' FOR [estado];

-- AlterTable
ALTER TABLE [dbo].[Empleado] DROP COLUMN [cargoId],
[departamentoId];

-- DropTable
DROP TABLE [dbo].[Asignaciones];

-- DropTable
DROP TABLE [dbo].[ModeloDispositivo];

-- CreateTable
CREATE TABLE [dbo].[ModeloEquipo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [img] NVARCHAR(1000),
    CONSTRAINT [ModeloEquipo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MarcaModeloEquipo] (
    [marcaId] NVARCHAR(1000) NOT NULL,
    [modeloEquipoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [MarcaModeloEquipo_pkey] PRIMARY KEY CLUSTERED ([marcaId],[modeloEquipoId])
);

-- CreateTable
CREATE TABLE [dbo].[EmpresaDepartamento] (
    [empresaId] NVARCHAR(1000) NOT NULL,
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [fechaAsignacion] DATETIME2 NOT NULL CONSTRAINT [EmpresaDepartamento_fechaAsignacion_df] DEFAULT CURRENT_TIMESTAMP,
    [activo] BIT NOT NULL CONSTRAINT [EmpresaDepartamento_activo_df] DEFAULT 1,
    CONSTRAINT [EmpresaDepartamento_pkey] PRIMARY KEY CLUSTERED ([empresaId],[departamentoId])
);

-- CreateTable
CREATE TABLE [dbo].[DepartamentoCargo] (
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [cargoId] NVARCHAR(1000) NOT NULL,
    [fechaCreacion] DATETIME2 NOT NULL CONSTRAINT [DepartamentoCargo_fechaCreacion_df] DEFAULT CURRENT_TIMESTAMP,
    [activo] BIT NOT NULL CONSTRAINT [DepartamentoCargo_activo_df] DEFAULT 1,
    CONSTRAINT [DepartamentoCargo_pkey] PRIMARY KEY CLUSTERED ([departamentoId],[cargoId])
);

-- CreateTable
CREATE TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] (
    [empleadoId] NVARCHAR(1000) NOT NULL,
    [empresaId] NVARCHAR(1000) NOT NULL,
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [cargoId] NVARCHAR(1000) NOT NULL,
    [fechaAsignacion] DATETIME2 NOT NULL CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_fechaAsignacion_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaDesasignacion] DATETIME2,
    [activo] BIT NOT NULL CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_activo_df] DEFAULT 1,
    CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_pkey] PRIMARY KEY CLUSTERED ([empleadoId],[empresaId],[departamentoId],[cargoId])
);

-- CreateTable
CREATE TABLE [dbo].[ComputadorModeloEquipo] (
    [computadorId] NVARCHAR(1000) NOT NULL,
    [modeloEquipoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ComputadorModeloEquipo_pkey] PRIMARY KEY CLUSTERED ([computadorId],[modeloEquipoId])
);

-- CreateTable
CREATE TABLE [dbo].[DispositivoModeloEquipo] (
    [dispositivoId] NVARCHAR(1000) NOT NULL,
    [modeloEquipoId] NVARCHAR(1000) NOT NULL,
    [tipoDispositivo] NVARCHAR(1000),
    CONSTRAINT [DispositivoModeloEquipo_pkey] PRIMARY KEY CLUSTERED ([dispositivoId],[modeloEquipoId])
);

-- CreateTable
CREATE TABLE [dbo].[AsignacionesEquipos] (
    [id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT [AsignacionesEquipos_date_df] DEFAULT CURRENT_TIMESTAMP,
    [notes] NVARCHAR(1000),
    [actionType] NVARCHAR(1000) NOT NULL,
    [motivo] NVARCHAR(1000),
    [targetType] NVARCHAR(1000) NOT NULL,
    [itemType] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AsignacionesEquipos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [activo] BIT NOT NULL CONSTRAINT [AsignacionesEquipos_activo_df] DEFAULT 1,
    [targetEmpleadoId] NVARCHAR(1000),
    [computadorId] NVARCHAR(1000),
    [dispositivoId] NVARCHAR(1000),
    [gerenteId] NVARCHAR(1000),
    [ubicacionId] NVARCHAR(1000),
    CONSTRAINT [AsignacionesEquipos_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DepartamentoGerente] (
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [gerenteId] NVARCHAR(1000) NOT NULL,
    [fechaAsignacion] DATETIME2 NOT NULL CONSTRAINT [DepartamentoGerente_fechaAsignacion_df] DEFAULT CURRENT_TIMESTAMP,
    [fechaDesasignacion] DATETIME2,
    [activo] BIT NOT NULL CONSTRAINT [DepartamentoGerente_activo_df] DEFAULT 1,
    CONSTRAINT [DepartamentoGerente_pkey] PRIMARY KEY CLUSTERED ([departamentoId],[gerenteId])
);

-- CreateTable
CREATE TABLE [dbo].[EmpleadoStatusHistory] (
    [id] NVARCHAR(1000) NOT NULL,
    [empleadoId] NVARCHAR(1000) NOT NULL,
    [accion] NVARCHAR(1000) NOT NULL,
    [fecha] NVARCHAR(1000) NOT NULL,
    [motivo] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmpleadoStatusHistory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [EmpleadoStatusHistory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MarcaModeloEquipo] ADD CONSTRAINT [MarcaModeloEquipo_marcaId_fkey] FOREIGN KEY ([marcaId]) REFERENCES [dbo].[Marca]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MarcaModeloEquipo] ADD CONSTRAINT [MarcaModeloEquipo_modeloEquipoId_fkey] FOREIGN KEY ([modeloEquipoId]) REFERENCES [dbo].[ModeloEquipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaDepartamento] ADD CONSTRAINT [EmpresaDepartamento_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaDepartamento] ADD CONSTRAINT [EmpresaDepartamento_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoCargo] ADD CONSTRAINT [DepartamentoCargo_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoCargo] ADD CONSTRAINT [DepartamentoCargo_cargoId_fkey] FOREIGN KEY ([cargoId]) REFERENCES [dbo].[Cargo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_cargoId_fkey] FOREIGN KEY ([cargoId]) REFERENCES [dbo].[Cargo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ComputadorModeloEquipo] ADD CONSTRAINT [ComputadorModeloEquipo_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ComputadorModeloEquipo] ADD CONSTRAINT [ComputadorModeloEquipo_modeloEquipoId_fkey] FOREIGN KEY ([modeloEquipoId]) REFERENCES [dbo].[ModeloEquipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispositivoModeloEquipo] ADD CONSTRAINT [DispositivoModeloEquipo_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispositivoModeloEquipo] ADD CONSTRAINT [DispositivoModeloEquipo_modeloEquipoId_fkey] FOREIGN KEY ([modeloEquipoId]) REFERENCES [dbo].[ModeloEquipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_targetEmpleadoId_fkey] FOREIGN KEY ([targetEmpleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_ubicacionId_fkey] FOREIGN KEY ([ubicacionId]) REFERENCES [dbo].[Ubicacion]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoGerente] ADD CONSTRAINT [DepartamentoGerente_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoGerente] ADD CONSTRAINT [DepartamentoGerente_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoStatusHistory] ADD CONSTRAINT [EmpleadoStatusHistory_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
