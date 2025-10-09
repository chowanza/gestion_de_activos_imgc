-- =============================================
-- Script para verificar usuario imgcAdmin
-- =============================================

-- 1. Verificar que el usuario imgcAdmin existe
SELECT 
    name as Usuario,
    type_desc as Tipo,
    create_date as FechaCreacion
FROM sys.server_principals 
WHERE name = 'imgcAdmin';

-- 2. Verificar permisos del usuario en la base de datos
USE gestion_activos_imgc;
GO

SELECT 
    dp.principal_id,
    dp.name as Usuario,
    dp.type_desc as Tipo,
    dp.create_date as FechaCreacion
FROM sys.database_principals dp
WHERE dp.name = 'imgcAdmin';

-- 3. Verificar roles asignados
SELECT 
    r.name as Rol,
    m.name as Usuario,
    m.type_desc as TipoUsuario
FROM sys.database_role_members rm
INNER JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
INNER JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
WHERE m.name = 'imgcAdmin';

-- 4. Verificar permisos específicos
SELECT 
    p.permission_name as Permiso,
    p.state_desc as Estado,
    o.name as Objeto
FROM sys.database_permissions p
LEFT JOIN sys.objects o ON p.major_id = o.object_id
WHERE p.grantee_principal_id = USER_ID('imgcAdmin');

-- 5. Verificar si puede crear tablas (test)
SELECT 
    'Test de permisos' as Test,
    CASE 
        WHEN HAS_PERMS_BY_NAME('gestion_activos_imgc', 'DATABASE', 'CREATE TABLE') = 1 
        THEN 'SI - Puede crear tablas'
        ELSE 'NO - No puede crear tablas'
    END as PermisoCrearTablas;

PRINT 'Verificacion de permisos completada.';
