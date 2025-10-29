BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Marca] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Marca_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Marca_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[ModeloEquipo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [img] NVARCHAR(1000),
    CONSTRAINT [ModeloEquipo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Ubicacion] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [direccion] NVARCHAR(1000),
    [piso] NVARCHAR(1000),
    [sala] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ubicacion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Ubicacion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Ubicacion_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Empresa] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Empresa_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [logo] NVARCHAR(1000),
    CONSTRAINT [Empresa_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Empresa_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[Departamento] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Departamento_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Departamento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Cargo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Cargo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Cargo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Empleado] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [ced] NVARCHAR(1000) NOT NULL,
    [fechaNacimiento] NVARCHAR(1000),
    [fechaIngreso] NVARCHAR(1000),
    [fechaDesincorporacion] NVARCHAR(1000),
    [fotoPerfil] TEXT,
    [email] NVARCHAR(1000),
    [direccion] NVARCHAR(1000),
    [telefono] NVARCHAR(1000),
    CONSTRAINT [Empleado_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Computador] (
    [id] NVARCHAR(1000) NOT NULL,
    [serial] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Computador_estado_df] DEFAULT 'OPERATIVO',
    [host] NVARCHAR(1000),
    [sisOperativo] NVARCHAR(1000),
    [arquitectura] NVARCHAR(1000),
    [macWifi] NVARCHAR(1000),
    [macEthernet] NVARCHAR(1000),
    [ram] NVARCHAR(1000),
    [almacenamiento] NVARCHAR(1000),
    [procesador] NVARCHAR(1000),
    [officeVersion] NVARCHAR(1000),
    [codigoImgc] NVARCHAR(1000) NOT NULL,
    [fechaCompra] DATETIME2,
    [monto] DECIMAL(32,16),
    [numeroFactura] NVARCHAR(1000),
    [proveedor] NVARCHAR(1000),
    [anydesk] NVARCHAR(1000),
    CONSTRAINT [Computador_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Computador_serial_key] UNIQUE NONCLUSTERED ([serial])
);

-- CreateTable
CREATE TABLE [dbo].[Dispositivo] (
    [id] NVARCHAR(1000) NOT NULL,
    [serial] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [Dispositivo_estado_df] DEFAULT 'OPERATIVO',
    [mac] NVARCHAR(1000),
    [ip] NVARCHAR(1000),
    [codigoImgc] NVARCHAR(1000) NOT NULL,
    [fechaCompra] DATETIME2,
    [monto] DECIMAL(32,16),
    [numeroFactura] NVARCHAR(1000),
    [proveedor] NVARCHAR(1000),
    CONSTRAINT [Dispositivo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Dispositivo_serial_key] UNIQUE NONCLUSTERED ([serial])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'No-Admin',
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[PasswordResetToken] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordResetToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordResetToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PasswordResetToken_token_key] UNIQUE NONCLUSTERED ([token])
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
    [evidenciaFotos] NVARCHAR(1000),
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
CREATE TABLE [dbo].[HistorialModificaciones] (
    [id] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL CONSTRAINT [HistorialModificaciones_fecha_df] DEFAULT CURRENT_TIMESTAMP,
    [campo] NVARCHAR(1000) NOT NULL,
    [valorAnterior] NVARCHAR(1000),
    [valorNuevo] NVARCHAR(1000),
    [computadorId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [HistorialModificaciones_pkey] PRIMARY KEY CLUSTERED ([id])
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

-- CreateTable
CREATE TABLE [dbo].[IntervencionesEquipos] (
    [id] NVARCHAR(1000) NOT NULL,
    [fecha] DATETIME2 NOT NULL CONSTRAINT [IntervencionesEquipos_fecha_df] DEFAULT CURRENT_TIMESTAMP,
    [notas] NVARCHAR(1000),
    [evidenciaFotos] NVARCHAR(1000),
    [computadorId] NVARCHAR(1000),
    [dispositivoId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [IntervencionesEquipos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [empleadoId] NVARCHAR(1000),
    CONSTRAINT [IntervencionesEquipos_pkey] PRIMARY KEY CLUSTERED ([id])
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

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B61A916C976] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PasswordResetToken_token_idx] ON [dbo].[PasswordResetToken]([token]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PasswordResetToken_userId_idx] ON [dbo].[PasswordResetToken]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialModificaciones_computadorId_idx] ON [dbo].[HistorialModificaciones]([computadorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_fecha_idx] ON [dbo].[HistorialMovimientos]([fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_accion_idx] ON [dbo].[HistorialMovimientos]([accion]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_entidad_idx] ON [dbo].[HistorialMovimientos]([entidad]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialMovimientos_usuarioId_idx] ON [dbo].[HistorialMovimientos]([usuarioId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_fecha_idx] ON [dbo].[IntervencionesEquipos]([fecha]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_computadorId_idx] ON [dbo].[IntervencionesEquipos]([computadorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_dispositivoId_idx] ON [dbo].[IntervencionesEquipos]([dispositivoId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IntervencionesEquipos_empleadoId_idx] ON [dbo].[IntervencionesEquipos]([empleadoId]);

-- AddForeignKey
ALTER TABLE [dbo].[PasswordResetToken] ADD CONSTRAINT [PasswordResetToken_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MarcaModeloEquipo] ADD CONSTRAINT [MarcaModeloEquipo_marcaId_fkey] FOREIGN KEY ([marcaId]) REFERENCES [dbo].[Marca]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MarcaModeloEquipo] ADD CONSTRAINT [MarcaModeloEquipo_modeloEquipoId_fkey] FOREIGN KEY ([modeloEquipoId]) REFERENCES [dbo].[ModeloEquipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaDepartamento] ADD CONSTRAINT [EmpresaDepartamento_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpresaDepartamento] ADD CONSTRAINT [EmpresaDepartamento_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoCargo] ADD CONSTRAINT [DepartamentoCargo_cargoId_fkey] FOREIGN KEY ([cargoId]) REFERENCES [dbo].[Cargo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoCargo] ADD CONSTRAINT [DepartamentoCargo_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_cargoId_fkey] FOREIGN KEY ([cargoId]) REFERENCES [dbo].[Cargo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EmpleadoEmpresaDepartamentoCargo] ADD CONSTRAINT [EmpleadoEmpresaDepartamentoCargo_empresaId_fkey] FOREIGN KEY ([empresaId]) REFERENCES [dbo].[Empresa]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ComputadorModeloEquipo] ADD CONSTRAINT [ComputadorModeloEquipo_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ComputadorModeloEquipo] ADD CONSTRAINT [ComputadorModeloEquipo_modeloEquipoId_fkey] FOREIGN KEY ([modeloEquipoId]) REFERENCES [dbo].[ModeloEquipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispositivoModeloEquipo] ADD CONSTRAINT [DispositivoModeloEquipo_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DispositivoModeloEquipo] ADD CONSTRAINT [DispositivoModeloEquipo_modeloEquipoId_fkey] FOREIGN KEY ([modeloEquipoId]) REFERENCES [dbo].[ModeloEquipo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_targetEmpleadoId_fkey] FOREIGN KEY ([targetEmpleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AsignacionesEquipos] ADD CONSTRAINT [AsignacionesEquipos_ubicacionId_fkey] FOREIGN KEY ([ubicacionId]) REFERENCES [dbo].[Ubicacion]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoGerente] ADD CONSTRAINT [DepartamentoGerente_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DepartamentoGerente] ADD CONSTRAINT [DepartamentoGerente_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HistorialModificaciones] ADD CONSTRAINT [HistorialModificaciones_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HistorialMovimientos] ADD CONSTRAINT [HistorialMovimientos_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IntervencionesEquipos] ADD CONSTRAINT [IntervencionesEquipos_empleadoId_fkey] FOREIGN KEY ([empleadoId]) REFERENCES [dbo].[Empleado]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

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
