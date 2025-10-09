@echo off
echo ================================================
echo VERIFICACION DE INSTALACION SQL SERVER
echo ================================================
echo.

echo [1] Verificando servicios de SQL Server instalados...
echo.
sc query | findstr "MSSQL"
echo.

echo [2] Verificando SQL Server Configuration Manager...
echo.
if exist "C:\Windows\SysWOW64\SQLServerManager15.msc" (
    echo OK: SQL Server Configuration Manager encontrado
) else (
    echo ADVERTENCIA: SQL Server Configuration Manager no encontrado
)

echo [3] Verificando archivos de SQL Server...
echo.
if exist "C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS" (
    echo OK: Directorio SQL Server Express encontrado
) else (
    echo ADVERTENCIA: Directorio SQL Server Express no encontrado
)

echo [4] Verificando sqlcmd...
echo.
sqlcmd -? >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: sqlcmd disponible
) else (
    echo ERROR: sqlcmd no disponible
    echo Instale SQL Server Command Line Utilities
)

echo [5] Verificando puertos en uso...
echo.
netstat -an | findstr ":1433"

echo.
echo ================================================
echo RESUMEN
echo ================================================
echo.
echo Si ve errores arriba:
echo 1. SQL Server puede no estar instalado
echo 2. Instale SQL Server 2019 Express
echo 3. O reinstale SQL Server
echo.
pause
