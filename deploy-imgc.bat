@echo off
echo ================================================
echo DESPLIEGUE SISTEMA GESTION DE ACTIVOS IMGC
echo ================================================
echo.

echo [1/8] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    pause
    exit /b 1
)

echo [2/8] Verificando conexion a SQL Server...
sqlcmd -S localhost\SQLEXPRESS_SGA -U imgcAdmin -P "1Mgc1R0n**" -d gestion_activos_imgc -Q "SELECT @@VERSION" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: No se puede conectar a SQL Server
    echo Verifique que:
    echo - SQL Server este corriendo
    echo - El usuario imgcAdmin exista
    echo - La base de datos gestion_activos_imgc exista
    pause
    exit /b 1
)

echo [3/8] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo la instalacion de dependencias
    pause
    exit /b 1
)

echo [4/8] Generando cliente Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Fallo la generacion del cliente Prisma
    pause
    exit /b 1
)

echo [5/8] Verificando conexion a base de datos...
call npx prisma db pull
if %errorlevel% neq 0 (
    echo ERROR: No se puede conectar a la base de datos
    echo Verifique el archivo .env
    pause
    exit /b 1
)

echo [6/8] Aplicando migraciones...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Fallo la aplicacion de migraciones
    pause
    exit /b 1
)

echo [7/8] Compilando aplicacion...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion
    pause
    exit /b 1
)

echo [8/8] Iniciando aplicacion con PM2...
call pm2 start ecosystem.config.js --env production
if %errorlevel% neq 0 (
    echo ERROR: Fallo el inicio con PM2
    pause
    exit /b 1
)

echo.
echo ================================================
echo DESPLIEGUE COMPLETADO EXITOSAMENTE!
echo ================================================
echo.
echo La aplicacion esta corriendo en: http://localhost:3000
echo.
echo Comandos utiles:
echo - Ver estado: pm2 status
echo - Ver logs: pm2 logs gestion-activos-imgc
echo - Reiniciar: pm2 restart gestion-activos-imgc
echo.
pause
