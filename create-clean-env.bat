@echo off
echo ================================================
echo CREANDO ARCHIVO .env LIMPIO
echo ================================================
echo.

echo Eliminando archivo .env actual...
del .env 2>nul

echo Creando nuevo archivo .env...
(
echo # Base de datos SQL Server 2019 - Configuracion IMGC
echo DATABASE_URL="sqlserver://imgcAdmin:1Mgc1R0n@WIN-9E5P7UTLA25\\SQLEXPRESS_SGA:1433;database=gestion_activos_imgc;encrypt=true;trustServerCertificate=true;"
echo.
echo # Shadow database para migraciones de Prisma
echo PRISMA_MIGRATE_SHADOW_DATABASE_URL="sqlserver://imgcAdmin:1Mgc1R0n@WIN-9E5P7UTLA25\\SQLEXPRESS_SGA:1433;database=master;encrypt=true;trustServerCertificate=true;"
echo.
echo # NextAuth.js
echo NEXTAUTH_URL="http://localhost:3000"
echo NEXTAUTH_SECRET="clave-super-secreta-para-nextauth-imgc-2024-produccion-segura"
echo.
echo # Configuracion de la aplicacion
echo NODE_ENV="production"
echo NEXT_PUBLIC_APP_URL="http://localhost:3000"
echo.
echo # Configuracion de archivos
echo NEXT_PUBLIC_MAX_FILE_SIZE="10485760"
echo NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"
echo.
echo # Configuracion especifica de SQL Server IMGC
echo SQL_SERVER_HOST="WIN-9E5P7UTLA25"
echo SQL_SERVER_PORT="1433"
echo SQL_SERVER_DATABASE="gestion_activos_imgc"
echo SQL_SERVER_USER="imgcAdmin"
echo SQL_SERVER_PASSWORD="1Mgc1R0n"
) > .env

echo.
echo Archivo .env creado exitosamente.
echo.
echo Verificando contenido:
type .env
echo.
echo ================================================
echo ARCHIVO .ENV CREADO
echo ================================================
echo.
pause
