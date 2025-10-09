@echo off
echo ================================================
echo CAMBIANDO CONTRASEÑAS DE USUARIOS SQL SERVER
echo ================================================
echo.

echo [1] Cambiando contraseña de 'sa'...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -Q "ALTER LOGIN sa WITH PASSWORD = 'AdminPass123!';"
if %errorlevel% equ 0 (
    echo OK: Contraseña de sa cambiada
) else (
    echo ERROR: No se pudo cambiar contraseña de sa
)

echo.
echo [2] Cambiando contraseña de 'imgcAdmin'...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U sa -P "AdminPass123!" -Q "ALTER LOGIN imgcAdmin WITH PASSWORD = 'ImgcPass123!';"
if %errorlevel% equ 0 (
    echo OK: Contraseña de imgcAdmin cambiada
) else (
    echo ERROR: No se pudo cambiar contraseña de imgcAdmin
)

echo.
echo [3] Verificando cambios...
sqlcmd -S WIN-9E5P7UTLA25\SQLEXPRESS_SGA -U sa -P "AdminPass123!" -Q "SELECT name, modify_date FROM sys.server_principals WHERE name IN ('sa', 'imgcAdmin');"

echo.
echo ================================================
echo CAMBIO DE CONTRASEÑAS COMPLETADO
echo ================================================
echo.
echo NUEVAS CONTRASEÑAS:
echo - sa: AdminPass123!
echo - imgcAdmin: ImgcPass123!
echo.
echo Actualice el archivo .env con las nuevas contraseñas.
echo.
pause
