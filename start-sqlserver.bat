@echo off
echo ================================================
echo INICIANDO SQL SERVER
echo ================================================
echo.

echo Verificando estado actual de SQL Server...
sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"

echo.
echo Intentando iniciar SQL Server...
net start MSSQL$SQLEXPRESS_SGA

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo SQL SERVER INICIADO EXITOSAMENTE!
    echo ================================================
    echo.
    echo Estado actual:
    sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"
    echo.
    echo Ahora puede ejecutar: verify-connection.bat
) else (
    echo.
    echo ================================================
    echo ERROR AL INICIAR SQL SERVER
    echo ================================================
    echo.
    echo Posibles soluciones:
    echo 1. Ejecutar como Administrador
    echo 2. Verificar que SQL Server este instalado
    echo 3. Verificar configuracion de servicios
    echo.
    echo Estado actual:
    sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"
)

echo.
pause
