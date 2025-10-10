@echo off
echo ===============================================
echo   DESPLIEGUE PARA INTRANET - IMGC
echo   IP de la VM: 172.16.3.123
echo ===============================================
echo.

echo [1] Copiando archivo de configuracion de produccion...
copy env.production .env >nul
if %errorlevel% neq 0 (
    echo ERROR: No se pudo copiar el archivo de configuracion
    pause
    exit /b 1
)
echo ✅ Archivo .env configurado para intranet

echo.
echo [2] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la instalacion de dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

echo.
echo [3] Generando cliente Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la generacion del cliente Prisma
    pause
    exit /b 1
)
echo ✅ Cliente Prisma generado

echo.
echo [4] Construyendo aplicacion para produccion...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la construccion de la aplicacion
    pause
    exit /b 1
)
echo ✅ Aplicacion construida

echo.
echo [5] Iniciando aplicacion con PM2...
call pm2 delete gestion-activos-imgc 2>nul
call pm2 start npm --name "gestion-activos-imgc" -- start
if %errorlevel% neq 0 (
    echo ERROR: Fallo al iniciar la aplicacion con PM2
    pause
    exit /b 1
)

echo.
echo [6] Configurando PM2 para inicio automatico...
call pm2 save
call pm2 startup
echo ✅ PM2 configurado para inicio automatico

echo.
echo ===============================================
echo   DESPLIEGUE COMPLETADO EXITOSAMENTE
echo ===============================================
echo.
echo 🌐 La aplicacion esta disponible en:
echo    http://172.16.3.123:3000
echo.
echo 📱 Acceso desde otras maquinas en la red:
echo    http://172.16.3.123:3000
echo.
echo 🔧 Comandos utiles:
echo    pm2 status          - Ver estado de la aplicacion
echo    pm2 logs            - Ver logs en tiempo real
echo    pm2 restart all     - Reiniciar aplicacion
echo    pm2 stop all        - Detener aplicacion
echo.
echo ⚠️  IMPORTANTE: Asegurate de que el firewall de Windows
echo    permita conexiones entrantes en el puerto 3000
echo.
pause
