@echo off
echo ================================================
echo CONFIGURANDO SQL SERVER PARA LOCALHOST
echo ================================================
echo.

echo [1] Verificando estado actual de SQL Server...
sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"

echo.
echo [2] Verificando puerto 1433...
netstat -an | findstr ":1433"

echo.
echo [3] Probando conexion actual...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n" -Q "SELECT 'Conexion actual exitosa'" 2>nul
if %errorlevel% equ 0 (
    echo OK: Conexion actual funciona
) else (
    echo ERROR: Conexion actual no funciona
)

echo.
echo [4] INSTRUCCIONES MANUALES:
echo.
echo 1. Abra SQL Server Configuration Manager
echo 2. Vaya a: SQL Server Network Configuration ^> Protocols for SQLEXPRESS_SGA
echo 3. Haga doble-click en TCP/IP
echo 4. En la pestaña IP Addresses:
echo    - IPAll: TCP Port = 1433
echo    - IP1 (127.0.0.1): Enabled = Yes, TCP Port = 1433
echo    - IP2 (::1): Enabled = Yes, TCP Port = 1433
echo 5. Click Aplicar y Aceptar
echo 6. Reinicie SQL Server
echo.

echo [5] Despues de configurar, ejecute:
echo net stop MSSQL$SQLEXPRESS_SGA
echo net start MSSQL$SQLEXPRESS_SGA
echo.

echo [6] Luego pruebe:
echo sqlcmd -S localhost -U imgcAdmin -P "1Mgc1R0n" -d gestion_activos_imgc
echo.

pause
