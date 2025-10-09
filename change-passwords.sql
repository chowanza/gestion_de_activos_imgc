-- =============================================
-- Script para cambiar contraseñas de usuarios
-- =============================================

-- 1. Cambiar contraseña de 'sa'
ALTER LOGIN sa WITH PASSWORD = '1Mgc1R0n';
PRINT 'Contraseña de sa cambiada exitosamente';

-- 2. Cambiar contraseña de 'imgcAdmin'
ALTER LOGIN imgcAdmin WITH PASSWORD = '1Mgc1R0n';
PRINT 'Contraseña de imgcAdmin cambiada exitosamente';

-- 3. Verificar que los cambios se aplicaron
SELECT 
    name as Usuario,
    type_desc as Tipo,
    create_date as FechaCreacion,
    modify_date as FechaModificacion
FROM sys.server_principals 
WHERE name IN ('sa', 'imgcAdmin');

PRINT 'Cambio de contraseñas completado exitosamente.';
