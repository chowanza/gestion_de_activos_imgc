@echo off
echo ================================================
echo CAMBIANDO A NODE.JS 20.11.0 PARA COMPATIBILIDAD
echo ================================================
echo.

echo Verificando si NVM esta instalado...
nvm version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: NVM no esta instalado
    echo.
    echo Instale NVM primero:
    echo 1. Descargue: https://github.com/coreybutler/nvm-windows/releases
    echo 2. Ejecute nvm-setup.exe como Administrador
    echo 3. Reinicie la terminal
    echo 4. Ejecute este script nuevamente
    pause
    exit /b 1
)

echo OK: NVM esta instalado
echo.

echo [1] Instalando Node.js 20.11.0...
nvm install 20.11.0

echo.
echo [2] Cambiando a Node.js 20.11.0...
nvm use 20.11.0

echo.
echo [3] Verificando versiones...
echo Node.js:
node --version
echo.
echo NPM:
npm --version
echo.
echo Prisma:
npx prisma --version

echo.
echo [4] Probando conexion con Prisma...
npx prisma db pull

echo.
echo ================================================
echo CAMBIO DE VERSION COMPLETADO
echo ================================================
echo.
echo Si todo funciona, ejecute:
echo deploy-imgc.bat
echo.
pause
