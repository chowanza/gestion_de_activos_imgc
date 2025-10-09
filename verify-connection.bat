@echo off
echo ================================================
echo VERIFICACION DE CONEXION SQL SERVER IMGC
echo ================================================
echo.

echo [1] Verificando que SQL Server este corriendo...
sc query MSSQL$SQLEXPRESS | findstr "RUNNING" >nul
if %errorlevel% neq 0 (
    echo ERROR: SQL Server no esta corriendo
    echo Inicie el servicio SQL Server (SQLEXPRESS)
    pause
    exit /b 1
) else (
    echo OK: SQL Server esta corriendo
)

echo [2] Verificando conectividad al puerto 1433...
telnet localhost 1433 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No se puede conectar al puerto 1433
    echo Verifique la configuracion de red de SQL Server
    pause
    exit /b 1
) else (
    echo OK: Puerto 1433 accesible
)

echo [3] Verificando usuario imgcAdmin...
sqlcmd -S localhost\SQLEXPRESS -U imgcAdmin -P "1Mgc1R0n**" -Q "SELECT 'Usuario conectado correctamente'" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: No se puede conectar con imgcAdmin
    echo Ejecute el script setup-sqlserver-imgc.sql
    pause
    exit /b 1
) else (
    echo OK: Usuario imgcAdmin conectado
)

echo [4] Verificando base de datos gestion_activos_imgc...
sqlcmd -S localhost\SQLEXPRESS -U imgcAdmin -P "1Mgc1R0n**" -d gestion_activos_imgc -Q "SELECT 'Base de datos accesible'" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: No se puede acceder a la base de datos
    echo Ejecute el script setup-sqlserver-imgc.sql
    pause
    exit /b 1
) else (
    echo OK: Base de datos gestion_activos_imgc accesible
)

echo [5] Verificando archivo .env...
if not exist .env (
    echo ERROR: Archivo .env no existe
    echo Copie env.template a .env
    pause
    exit /b 1
) else (
    echo OK: Archivo .env existe
)

echo.
echo ================================================
echo VERIFICACION COMPLETADA EXITOSAMENTE!
echo ================================================
echo.
echo Todo esta listo para el despliegue.
echo Ejecute: deploy-imgc.bat
echo.
pause
