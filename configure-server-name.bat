@echo off
echo ================================================
echo CONFIGURANDO SERVIDOR COMO SQLEXPRESS_SGA
echo ================================================
echo.

echo [1] Verificando estado actual...
sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"

echo.
echo [2] INSTRUCCIONES PARA CONFIGURAR:
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

echo [3] Despues de configurar, ejecute estos comandos:
echo.
echo net stop MSSQL$SQLEXPRESS_SGA
echo timeout /t 5 /nobreak
echo net start MSSQL$SQLEXPRESS_SGA
echo.

echo [4] Luego pruebe la conexion:
echo sqlcmd -S SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n" -d gestion_activos_imgc
echo.

echo [5] Si funciona, actualice el .env con:
echo DATABASE_URL="sqlserver://imgcAdmin:1Mgc1R0n@SQLEXPRESS_SGA:1433;database=gestion_activos_imgc;encrypt=true;trustServerCertificate=true;"
echo.

pause

