@echo off
echo ================================================
echo PROBANDO CONEXION SIMPLIFICADA
echo ================================================
echo.

echo Creando archivo .env simplificado...
(
echo DATABASE_URL="sqlserver://imgcAdmin:1Mgc1R0n@WIN-9E5P7UTLA25\\SQLEXPRESS_SGA:1433;database=gestion_activos_imgc;"
echo PRISMA_MIGRATE_SHADOW_DATABASE_URL="sqlserver://imgcAdmin:1Mgc1R0n@WIN-9E5P7UTLA25\\SQLEXPRESS_SGA:1433;database=master;"
) > .env

echo.
echo Contenido del archivo .env:
type .env
echo.

echo Probando conexion con Prisma...
npx prisma db pull

echo.
pause
