@echo off
echo ================================================
echo DIAGNOSTICO ERROR P1001 - CONECTIVIDAD SQL SERVER
echo ================================================
echo.

echo [1] Verificando servicios de SQL Server...
sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"
echo.

echo [2] Verificando puerto 1433...
netstat -an | findstr ":1433"
echo.

echo [3] Probando conexion con sqlcmd (localhost)...
sqlcmd -S localhost -U imgcAdmin -P "1Mgc1R0n" -Q "SELECT 'Conexion localhost exitosa'" 2>nul
if %errorlevel% equ 0 (
    echo OK: Conexion localhost exitosa
) else (
    echo ERROR: No se puede conectar a localhost
)

echo.
echo [4] Probando conexion con sqlcmd (localhost con instancia)...
sqlcmd -S localhost\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n" -Q "SELECT 'Conexion localhost\SQLEXPRESS_SGA exitosa'" 2>nul
if %errorlevel% equ 0 (
    echo OK: Conexion localhost\SQLEXPRESS_SGA exitosa
) else (
    echo ERROR: No se puede conectar a localhost\SQLEXPRESS_SGA
)

echo.
echo [5] Probando conexion con sqlcmd (nombre completo)...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n" -Q "SELECT 'Conexion WIN-9E5P7UTLA25\SQLEXPRESS_SGA exitosa'" 2>nul
if %errorlevel% equ 0 (
    echo OK: Conexion WIN-9E5P7UTLA25\SQLEXPRESS_SGA exitosa
) else (
    echo ERROR: No se puede conectar a WIN-9E5P7UTLA25\SQLEXPRESS_SGA
)

echo.
echo [6] Verificando configuracion TCP/IP...
echo Busque en SQL Server Configuration Manager:
echo - SQL Server Network Configuration ^> Protocols for SQLEXPRESS_SGA ^> TCP/IP
echo - Verifique que TCP/IP este habilitado
echo - En IP Addresses, verifique que todas las IPs tengan puerto 1433

echo.
pause
