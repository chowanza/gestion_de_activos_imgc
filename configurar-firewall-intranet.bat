@echo off
echo ===============================================
echo   CONFIGURACION DE FIREWALL PARA INTRANET
echo ===============================================
echo.

echo [1] Configurando regla de firewall para puerto 3000...
netsh advfirewall firewall add rule name="IMGC App Puerto 3000" dir=in action=allow protocol=TCP localport=3000
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: No se pudo crear la regla de firewall
    echo    Puede que necesites ejecutar como administrador
) else (
    echo ✅ Regla de firewall creada exitosamente
)

echo.
echo [2] Configurando regla para SQL Server puerto 1433...
netsh advfirewall firewall add rule name="SQL Server Puerto 1433" dir=in action=allow protocol=TCP localport=1433
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: No se pudo crear la regla para SQL Server
) else (
    echo ✅ Regla de firewall para SQL Server creada
)

echo.
echo [3] Verificando reglas de firewall existentes...
echo.
echo Reglas activas para puerto 3000:
netsh advfirewall firewall show rule name="IMGC App Puerto 3000" dir=in
echo.
echo Reglas activas para puerto 1433:
netsh advfirewall firewall show rule name="SQL Server Puerto 1433" dir=in

echo.
echo ===============================================
echo   CONFIGURACION DE FIREWALL COMPLETADA
echo ===============================================
echo.
echo ✅ El firewall esta configurado para permitir:
echo    - Puerto 3000 (Aplicacion IMGC)
echo    - Puerto 1433 (SQL Server)
echo.
echo 🌐 La aplicacion sera accesible desde:
echo    http://172.16.3.123:3000
echo.
echo 📱 Todas las maquinas en la red local podran acceder
echo.
pause
