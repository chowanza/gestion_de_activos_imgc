@echo off
echo ===============================================
echo   VERIFICACION DE CONECTIVIDAD INTRANET
echo ===============================================
echo.

echo [1] Verificando IP de la VM...
echo IP actual de la VM:
ipconfig | findstr "IPv4"
echo.

echo [2] Verificando que la aplicacion este corriendo...
netstat -an | findstr ":3000"
if %errorlevel% neq 0 (
    echo ❌ La aplicacion NO esta corriendo en el puerto 3000
    echo    Ejecuta: pm2 start npm --name "gestion-activos-imgc" -- start
) else (
    echo ✅ La aplicacion esta corriendo en el puerto 3000
)
echo.

echo [3] Verificando reglas de firewall...
netsh advfirewall firewall show rule name="IMGC App Puerto 3000" dir=in | findstr "Enabled"
if %errorlevel% neq 0 (
    echo ❌ Regla de firewall NO configurada
    echo    Ejecuta: configurar-firewall-intranet.bat
) else (
    echo ✅ Regla de firewall configurada correctamente
)
echo.

echo [4] Probando conectividad local...
curl -s http://172.16.3.123:3000 >nul
if %errorlevel% neq 0 (
    echo ❌ No se puede conectar localmente
    echo    Verifica que la aplicacion este corriendo
) else (
    echo ✅ Conectividad local funcionando
)
echo.

echo ===============================================
echo   RESUMEN DE CONECTIVIDAD
echo ===============================================
echo.
echo 🌐 URL de acceso desde cualquier maquina en la red:
echo    http://172.16.3.123:3000
echo.
echo 🔧 Para acceder desde otras maquinas:
echo    1. Asegurate de que esten en la misma red (172.16.x.x)
echo    2. Abre el navegador
echo    3. Ve a: http://172.16.3.123:3000
echo.
echo 📱 Si no funciona desde otras maquinas:
echo    - Verifica que el firewall este configurado
echo    - Verifica que esten en la misma red
echo    - Verifica que la aplicacion este corriendo
echo.
pause
