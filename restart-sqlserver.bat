@echo off
echo ================================================
echo REINICIANDO SQL SERVER DESPUES DE CONFIGURACION
echo ================================================
echo.

echo Deteniendo SQL Server...
net stop MSSQL$SQLEXPRESS_SGA_SGA

echo Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo Iniciando SQL Server...
net start MSSQL$SQLEXPRESS_SGA_SGA

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo SQL SERVER REINICIADO EXITOSAMENTE!
    echo ================================================
    echo.
    echo Estado actual:
    sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"
    echo.
    echo Ahora puede ejecutar: verify-connection.bat
) else (
    echo.
    echo ================================================
    echo ERROR AL REINICIAR SQL SERVER
    echo ================================================
    echo.
    echo Verifique la configuracion de TCP/IP
    echo Estado actual:
    sc query MSSQL$SQLEXPRESS_SGA | findstr "STATE"
)

echo.
pause
