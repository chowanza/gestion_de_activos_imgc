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
CREATE TABLE [dbo].[ModeloDispositivo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [marcaId] NVARCHAR(1000) NOT NULL,
    [tipo] NVARCHAR(1000) NOT NULL,
    [img] NVARCHAR(1000),
    CONSTRAINT [ModeloDispositivo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Gerencia] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [gerenteId] NVARCHAR(1000),
    CONSTRAINT [Gerencia_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Configuracion] (
    [id] INT NOT NULL CONSTRAINT [Configuracion_id_df] DEFAULT 1,
    [gerenteGeneralId] NVARCHAR(1000),
    CONSTRAINT [Configuracion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Configuracion_gerenteGeneralId_key] UNIQUE NONCLUSTERED ([gerenteGeneralId])
);

-- CreateTable
CREATE TABLE [dbo].[Departamento] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [gerenciaId] NVARCHAR(1000) NOT NULL,
    [ceco] NVARCHAR(1000) NOT NULL,
    [sociedad] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Departamento_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Usuario] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [cargo] NVARCHAR(1000) NOT NULL,
    [legajo] INT NOT NULL,
    [ced] NVARCHAR(1000) NOT NULL,
    [departamentoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Usuario_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Computador] (
    [id] NVARCHAR(1000) NOT NULL,
    [serial] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL,
    [modeloId] NVARCHAR(1000) NOT NULL,
    [usuarioId] NVARCHAR(1000),
    [departamentoId] NVARCHAR(1000),
    [nsap] NVARCHAR(1000),
    [host] NVARCHAR(1000),
    [sede] NVARCHAR(1000),
    [ubicacion] NVARCHAR(1000),
    [sisOperativo] NVARCHAR(1000),
    [arquitectura] NVARCHAR(1000),
    [macWifi] NVARCHAR(1000),
    [macEthernet] NVARCHAR(1000),
    [ram] NVARCHAR(1000),
    [almacenamiento] NVARCHAR(1000),
    [procesador] NVARCHAR(1000),
    [sapVersion] NVARCHAR(1000),
    [officeVersion] NVARCHAR(1000),
    CONSTRAINT [Computador_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Computador_serial_key] UNIQUE NONCLUSTERED ([serial])
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
CREATE TABLE [dbo].[Dispositivo] (
    [id] NVARCHAR(1000) NOT NULL,
    [serial] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL,
    [modeloId] NVARCHAR(1000) NOT NULL,
    [ubicacion] NVARCHAR(1000),
    [usuarioId] NVARCHAR(1000),
    [departamentoId] NVARCHAR(1000),
    [mac] NVARCHAR(1000),
    [ip] NVARCHAR(1000),
    [nsap] NVARCHAR(1000),
    CONSTRAINT [Dispositivo_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Dispositivo_serial_key] UNIQUE NONCLUSTERED ([serial])
);

-- CreateTable
CREATE TABLE [dbo].[LineaTelefonica] (
    [id] NVARCHAR(1000) NOT NULL,
    [numero] NVARCHAR(1000) NOT NULL,
    [proveedor] NVARCHAR(1000) NOT NULL,
    [destino] NVARCHAR(1000),
    [estado] NVARCHAR(1000),
    [imei] NVARCHAR(1000),
    CONSTRAINT [LineaTelefonica_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'user',
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[Asignaciones] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL CONSTRAINT [Asignaciones_date_df] DEFAULT CURRENT_TIMESTAMP,
    [notes] NVARCHAR(1000),
    [actionType] NVARCHAR(1000) NOT NULL,
    [motivo] NVARCHAR(1000),
    [gerente] NVARCHAR(1000),
    [localidad] NVARCHAR(1000),
    [serialC] NVARCHAR(1000),
    [modeloC] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Asignaciones_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [targetType] NVARCHAR(1000) NOT NULL,
    [targetUsuarioId] NVARCHAR(1000),
    [targetDepartamentoId] NVARCHAR(1000),
    [itemType] NVARCHAR(1000) NOT NULL,
    [computadorId] NVARCHAR(1000),
    [dispositivoId] NVARCHAR(1000),
    [lineaTelefonicaId] NVARCHAR(1000),
    [gerenteId] NVARCHAR(1000),
    CONSTRAINT [Asignaciones_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HistorialModificaciones_computadorId_idx] ON [dbo].[HistorialModificaciones]([computadorId]);

-- AddForeignKey
ALTER TABLE [dbo].[ModeloDispositivo] ADD CONSTRAINT [ModeloDispositivo_marcaId_fkey] FOREIGN KEY ([marcaId]) REFERENCES [dbo].[Marca]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Gerencia] ADD CONSTRAINT [Gerencia_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Configuracion] ADD CONSTRAINT [Configuracion_gerenteGeneralId_fkey] FOREIGN KEY ([gerenteGeneralId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Departamento] ADD CONSTRAINT [Departamento_gerenciaId_fkey] FOREIGN KEY ([gerenciaId]) REFERENCES [dbo].[Gerencia]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Computador] ADD CONSTRAINT [Computador_modeloId_fkey] FOREIGN KEY ([modeloId]) REFERENCES [dbo].[ModeloDispositivo]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Computador] ADD CONSTRAINT [Computador_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Computador] ADD CONSTRAINT [Computador_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HistorialModificaciones] ADD CONSTRAINT [HistorialModificaciones_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Dispositivo] ADD CONSTRAINT [Dispositivo_modeloId_fkey] FOREIGN KEY ([modeloId]) REFERENCES [dbo].[ModeloDispositivo]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Dispositivo] ADD CONSTRAINT [Dispositivo_usuarioId_fkey] FOREIGN KEY ([usuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Dispositivo] ADD CONSTRAINT [Dispositivo_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_targetUsuarioId_fkey] FOREIGN KEY ([targetUsuarioId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_targetDepartamentoId_fkey] FOREIGN KEY ([targetDepartamentoId]) REFERENCES [dbo].[Departamento]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_computadorId_fkey] FOREIGN KEY ([computadorId]) REFERENCES [dbo].[Computador]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_dispositivoId_fkey] FOREIGN KEY ([dispositivoId]) REFERENCES [dbo].[Dispositivo]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_lineaTelefonicaId_fkey] FOREIGN KEY ([lineaTelefonicaId]) REFERENCES [dbo].[LineaTelefonica]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asignaciones] ADD CONSTRAINT [Asignaciones_gerenteId_fkey] FOREIGN KEY ([gerenteId]) REFERENCES [dbo].[Usuario]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
