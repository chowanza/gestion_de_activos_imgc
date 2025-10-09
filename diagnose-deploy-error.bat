@echo off
echo ================================================
echo DIAGNOSTICO ERROR DEPLOY PASO 5/8
echo ================================================
echo.

echo [1] Verificando archivo .env...
if not exist .env (
    echo ERROR: Archivo .env no existe
    echo SOLUCION: Copiar env.template a .env
    pause
    exit /b 1
) else (
    echo OK: Archivo .env existe
)

echo.
echo [2] Verificando contenido del archivo .env...
echo.
type .env
echo.

echo [3] Verificando conexion con imgcAdmin...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n**" -Q "SELECT 'Conexion exitosa con imgcAdmin'" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: No se puede conectar con imgcAdmin
    echo Verifique:
    echo - Usuario imgcAdmin existe
    echo - Password correcto
    echo - Permisos en la base de datos
) else (
    echo OK: Conexion con imgcAdmin exitosa
)

echo.
echo [4] Verificando acceso a la base de datos...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n**" -d gestion_activos_imgc -Q "SELECT 'Acceso a base de datos exitoso'" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: No se puede acceder a gestion_activos_imgc
    echo Verifique:
    echo - Base de datos existe
    echo - Usuario tiene permisos
) else (
    echo OK: Acceso a base de datos exitoso
)

echo.
echo [5] Verificando tablas existentes...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n**" -d gestion_activos_imgc -Q "SELECT COUNT(*) as Tablas FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'" 2>nul

echo.
echo [6] Verificando Prisma...
npx prisma --version 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Prisma no disponible
    echo SOLUCION: npm install
) else (
    echo OK: Prisma disponible
)

echo.
pause
