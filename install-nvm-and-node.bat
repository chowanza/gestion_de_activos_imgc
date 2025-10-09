@echo off
echo ================================================
echo INSTALANDO NVM Y CAMBIANDO A NODE.JS 20.11
echo ================================================
echo.

echo [1] Descargando NVM para Windows...
echo Descargando desde: https://github.com/coreybutler/nvm-windows/releases
echo.
echo Por favor descarga manualmente:
echo 1. Ve a: https://github.com/coreybutler/nvm-windows/releases
echo 2. Descarga: nvm-setup.exe (ultima version)
echo 3. Ejecuta nvm-setup.exe como Administrador
echo 4. Reinicia la terminal despues de instalar
echo.

echo [2] Despues de instalar NVM, ejecuta estos comandos:
echo.
echo nvm install 20.11.0
echo nvm use 20.11.0
echo node --version
echo npx prisma --version
echo.

echo [3] Verificando versiones actuales...
echo Node.js actual:
node --version
echo.
echo NPM actual:
npm --version
echo.

pause
