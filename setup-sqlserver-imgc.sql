-- =============================================
-- Script de configuración SQL Server 2019
-- Para Sistema de Gestión de Activos IMGC
-- Usuario: imgcAdmin
-- =============================================

-- 1. Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'gestion_activos_imgc')
BEGIN
    CREATE DATABASE gestion_activos_imgc;
    PRINT 'Base de datos gestion_activos_imgc creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La base de datos gestion_activos_imgc ya existe.';
END

-- 2. Usar la base de datos
USE gestion_activos_imgc;

-- 3. Crear usuario específico para la aplicación
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'imgcAdmin')
BEGIN
    CREATE LOGIN imgcAdmin WITH PASSWORD = '1Mgc1R0n**';
    PRINT 'Usuario imgcAdmin creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'El usuario imgcAdmin ya existe.';
END

-- 4. Asignar usuario a la base de datos
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'imgcAdmin')
BEGIN
    CREATE USER imgcAdmin FOR LOGIN imgcAdmin;
    PRINT 'Usuario asignado a la base de datos.';
END

-- 5. Otorgar permisos completos
ALTER ROLE db_owner ADD MEMBER imgcAdmin;
PRINT 'Permisos otorgados exitosamente.';

-- 6. Configurar opciones de la base de datos
ALTER DATABASE gestion_activos_imgc SET RECOVERY SIMPLE;
ALTER DATABASE gestion_activos_imgc SET AUTO_SHRINK OFF;
ALTER DATABASE gestion_activos_imgc SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE gestion_activos_imgc SET AUTO_UPDATE_STATISTICS ON;

-- 7. Verificar configuración
SELECT 
    'Server' as Componente,
    @@SERVERNAME as Valor
UNION ALL
SELECT 
    'Database',
    DB_NAME()
UNION ALL
SELECT 
    'User',
    USER_NAME()
UNION ALL
SELECT 
    'Version',
    @@VERSION;

PRINT 'Configuración de SQL Server completada exitosamente.';
