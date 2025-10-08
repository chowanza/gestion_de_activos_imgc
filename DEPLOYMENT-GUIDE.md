# 🚀 GUÍA COMPLETA DE DESPLIEGUE A PRODUCCIÓN - VM WINDOWS 10

## 📋 INFORMACIÓN DEL PROYECTO
- **Framework**: Next.js 15.4.5 con React 19
- **Base de Datos**: SQL Server 2019
- **ORM**: Prisma 6.9.0
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI
- **Gestión de Estado**: TanStack Query

---

## 🗄️ CONFIGURACIÓN DE SQL SERVER 2019

### Instalación y Configuración Inicial

#### 1. Descargar e Instalar SQL Server 2019

```bash
# 1. Descargar SQL Server 2019 Express (Gratuito)
# URL: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
# Seleccionar: SQL Server 2019 Express

# 2. Ejecutar instalador como administrador
# 3. Seleccionar: "New SQL Server stand-alone installation"
# 4. Aceptar términos de licencia
# 5. Seleccionar: "Basic" installation type
```

#### 2. Configuración Durante la Instalación

```
Configuración recomendada:
- Instance Name: SQLEXPRESS (por defecto)
- Instance ID: SQLEXPRESS
- Authentication Mode: Mixed Mode
- SQL Server Administrator: sa
- Password: [Crear contraseña segura]
- Service Account: NT AUTHORITY\SYSTEM
```

#### 3. Configuración Post-Instalación

```sql
-- 1. Conectar con SQL Server Management Studio (SSMS)
-- 2. Autenticación: SQL Server Authentication
-- 3. Login: sa
-- 4. Password: [tu contraseña]

-- Habilitar autenticación mixta
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', 
     N'Software\Microsoft\MSSQLServer\MSSQLServer', 
     N'LoginMode', REG_DWORD, 2;

-- Crear base de datos para la aplicación
CREATE DATABASE gestion_activos_imgc;

-- Crear usuario específico para la aplicación
USE gestion_activos_imgc;
CREATE LOGIN app_user WITH PASSWORD = 'AppPassword123!';
CREATE USER app_user FOR LOGIN app_user;
ALTER ROLE db_owner ADD MEMBER app_user;

-- Habilitar TCP/IP (si no está habilitado)
-- 1. SQL Server Configuration Manager
-- 2. SQL Server Network Configuration
-- 3. Protocols for SQLEXPRESS
-- 4. Habilitar TCP/IP
-- 5. Reiniciar servicio SQL Server
```

#### 4. Configuración de Firewall

```bash
# Abrir puertos necesarios en Windows Firewall
netsh advfirewall firewall add rule name="SQL Server" dir=in action=allow protocol=TCP localport=1433
netsh advfirewall firewall add rule name="SQL Server Browser" dir=in action=allow protocol=UDP localport=1434

# Verificar que los servicios estén corriendo
services.msc
# Buscar: SQL Server (SQLEXPRESS)
# Buscar: SQL Server Browser
```

#### 5. Configuración de Red

```bash
# Verificar configuración de red
# 1. SQL Server Configuration Manager
# 2. SQL Server Network Configuration
# 3. Protocols for SQLEXPRESS
# 4. TCP/IP Properties
# 5. IP Addresses tab
# 6. Habilitar "Enabled" para todas las IPs
# 7. Establecer TCP Port: 1433
```

#### 6. Configuración de Seguridad

```sql
-- Conectar como sa y ejecutar:

-- Crear usuario específico para la aplicación
USE master;
CREATE LOGIN gestion_activos_user WITH PASSWORD = 'GestionActivos2024!';

-- Asignar permisos a la base de datos
USE gestion_activos_imgc;
CREATE USER gestion_activos_user FOR LOGIN gestion_activos_user;
ALTER ROLE db_owner ADD MEMBER gestion_activos_user;

-- Verificar conexión
SELECT @@SERVERNAME as 'Server Name',
       DB_NAME() as 'Database Name',
       USER_NAME() as 'Current User';
```

### Script de Configuración Automatizada

Crear archivo `setup-sqlserver.sql`:

```sql
-- =============================================
-- Script de configuración SQL Server 2019
-- Para Sistema de Gestión de Activos IMGC
-- =============================================

-- 1. Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'gestion_activos_imgc')
BEGIN
    CREATE DATABASE gestion_activos_imgc;
    PRINT 'Base de datos gestion_activos_imgc creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La base de datos gestion_activos_imgc ya existe.';
END

-- 2. Usar la base de datos
USE gestion_activos_imgc;

-- 3. Crear usuario específico para la aplicación
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'gestion_activos_user')
BEGIN
    CREATE LOGIN gestion_activos_user WITH PASSWORD = 'GestionActivos2024!';
    PRINT 'Usuario gestion_activos_user creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'El usuario gestion_activos_user ya existe.';
END

-- 4. Asignar usuario a la base de datos
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'gestion_activos_user')
BEGIN
    CREATE USER gestion_activos_user FOR LOGIN gestion_activos_user;
    PRINT 'Usuario asignado a la base de datos.';
END

-- 5. Otorgar permisos completos
ALTER ROLE db_owner ADD MEMBER gestion_activos_user;
PRINT 'Permisos otorgados exitosamente.';

-- 6. Configurar opciones de la base de datos
ALTER DATABASE gestion_activos_imgc SET RECOVERY SIMPLE;
ALTER DATABASE gestion_activos_imgc SET AUTO_SHRINK OFF;
ALTER DATABASE gestion_activos_imgc SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE gestion_activos_imgc SET AUTO_UPDATE_STATISTICS ON;

-- 7. Verificar configuración
SELECT 
    'Server' as Componente,
    @@SERVERNAME as Valor
UNION ALL
SELECT 
    'Database',
    DB_NAME()
UNION ALL
SELECT 
    'User',
    USER_NAME()
UNION ALL
SELECT 
    'Version',
    @@VERSION;

PRINT 'Configuración de SQL Server completada exitosamente.';
```

### Comandos de Verificación

```bash
# Verificar que SQL Server esté corriendo
sc query MSSQL$SQLEXPRESS

# Verificar conectividad
telnet localhost 1433

# Probar conexión con sqlcmd
sqlcmd -S localhost\SQLEXPRESS -U sa -P [tu_contraseña] -Q "SELECT @@VERSION"

# Probar conexión con la aplicación
sqlcmd -S localhost\SQLEXPRESS -U gestion_activos_user -P GestionActivos2024! -d gestion_activos_imgc -Q "SELECT DB_NAME()"
```

### Troubleshooting SQL Server

#### Problema: No se puede conectar
```bash
# 1. Verificar que el servicio esté corriendo
services.msc
# Buscar: SQL Server (SQLEXPRESS)

# 2. Verificar configuración TCP/IP
# SQL Server Configuration Manager
# SQL Server Network Configuration
# Protocols for SQLEXPRESS
# TCP/IP - Properties - IP Addresses

# 3. Verificar firewall
netsh advfirewall firewall show rule name="SQL Server"

# 4. Reiniciar servicios
net stop MSSQL$SQLEXPRESS
net start MSSQL$SQLEXPRESS
```

#### Problema: Error de autenticación
```sql
-- Verificar que la autenticación mixta esté habilitada
EXEC xp_instance_regread N'HKEY_LOCAL_MACHINE', 
     N'Software\Microsoft\MSSQLServer\MSSQLServer', 
     N'LoginMode';

-- Si devuelve 1, cambiar a 2 para habilitar autenticación mixta
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', 
     N'Software\Microsoft\MSSQLServer\MSSQLServer', 
     N'LoginMode', REG_DWORD, 2;
```

#### Problema: Puerto no disponible
```bash
# Verificar qué proceso está usando el puerto 1433
netstat -ano | findstr :1433

# Si es necesario, cambiar puerto en SQL Server Configuration Manager
# TCP/IP Properties - IP Addresses - TCP Port
```

---

## 🔧 PARTE 1: DESPLIEGUE DIRECTO CON PM2 (RECOMENDADO)

### 1.1 Configuración de Variables de Entorno

Crear archivo `.env.production` en la raíz del proyecto:

```bash
# Base de datos SQL Server 2019
# Formato: sqlserver://usuario:contraseña@servidor:puerto;database=nombre_bd;encrypt=true;trustServerCertificate=true;
DATABASE_URL="sqlserver://gestion_activos_user:GestionActivos2024!@localhost:1433;database=gestion_activos_imgc;encrypt=true;trustServerCertificate=true;"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="clave-super-secreta-para-nextauth-de-al-menos-32-caracteres-minimos"

# Configuración de la aplicación
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Configuración de archivos (opcional)
NEXT_PUBLIC_MAX_FILE_SIZE="10485760"
NEXT_PUBLIC_ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"

# Configuración específica de SQL Server
SQL_SERVER_HOST="localhost"
SQL_SERVER_PORT="1433"
SQL_SERVER_DATABASE="gestion_activos_imgc"
SQL_SERVER_USER="gestion_activos_user"
SQL_SERVER_PASSWORD="GestionActivos2024!"

# Configuración de conexión alternativa (si es necesario)
DATABASE_URL_ALT="Server=localhost,1433;Database=gestion_activos_imgc;User Id=gestion_activos_user;Password=GestionActivos2024!;Encrypt=true;TrustServerCertificate=true;"
```

#### Ejemplos de Configuración por Escenario:

**Para VM Local:**
```bash
DATABASE_URL="sqlserver://gestion_activos_user:GestionActivos2024!@localhost:1433;database=gestion_activos_imgc;encrypt=true;trustServerCertificate=true;"
```

**Para Servidor Remoto:**
```bash
DATABASE_URL="sqlserver://gestion_activos_user:GestionActivos2024!@192.168.1.100:1433;database=gestion_activos_imgc;encrypt=true;trustServerCertificate=true;"
```

**Para SQL Server con Instancia Nombre:**
```bash
DATABASE_URL="sqlserver://gestion_activos_user:GestionActivos2024!@localhost\\SQLEXPRESS:1433;database=gestion_activos_imgc;encrypt=true;trustServerCertificate=true;"
```

### 1.2 Configuración de Prisma para SQL Server

#### Verificar configuración de Prisma:

```javascript
// prisma/schema.prisma debe contener:
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

#### Comandos de Prisma específicos para SQL Server:

```bash
# 1. Verificar conexión a la base de datos
npx prisma db pull

# 2. Generar cliente de Prisma
npx prisma generate

# 3. Crear migración inicial (si es la primera vez)
npx prisma migrate dev --name init

# 4. Aplicar migraciones en producción
npx prisma migrate deploy

# 5. Poblar datos iniciales
npx prisma db seed

# 6. Verificar estado de la base de datos
npx prisma migrate status

# 7. Abrir Prisma Studio para verificar datos
npx prisma studio
```

### 1.3 Comandos de Instalación y Build

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar conexión a SQL Server
npx prisma db pull

# 3. Generar cliente de Prisma
npx prisma generate

# 4. Ejecutar migraciones (si es la primera vez)
npx prisma migrate deploy

# 5. Poblar datos iniciales (opcional)
npm run seed

# 6. Compilar para producción
npm run build

# 7. Verificar que la compilación fue exitosa
npm run start
```

### 1.4 Configuración de PM2

Crear archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'gestion-activos-imgc',
    script: 'npm',
    args: 'start',
    cwd: 'C:\\ruta\\completa\\al\\proyecto',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 1.5 Comandos PM2 para Producción

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Crear directorio de logs
mkdir logs

# 3. Iniciar la aplicación con PM2
pm2 start ecosystem.config.js --env production

# 4. Configurar PM2 para iniciar automáticamente en Windows
pm2 startup
pm2 save

# 5. Verificar estado
pm2 status
pm2 logs gestion-activos-imgc

# 6. Comandos útiles
pm2 restart gestion-activos-imgc    # Reiniciar
pm2 stop gestion-activos-imgc       # Detener
pm2 delete gestion-activos-imgc     # Eliminar
pm2 monit                           # Monitor en tiempo real
```

### 1.6 Scripts de Automatización

Crear archivo `deploy.bat`:

```batch
@echo off
echo Iniciando despliegue de Gestion de Activos IMGC...

REM Detener aplicación si está corriendo
pm2 stop gestion-activos-imgc

REM Actualizar dependencias
echo Instalando dependencias...
npm install

REM Generar cliente Prisma
echo Generando cliente Prisma...
npx prisma generate

REM Compilar aplicación
echo Compilando aplicación...
npm run build

REM Iniciar aplicación
echo Iniciando aplicación...
pm2 start ecosystem.config.js --env production

echo Despliegue completado!
pm2 status
pause
```

Crear archivo `monitor.bat`:

```batch
@echo off
echo Estado de la aplicación:
pm2 status
echo.
echo Logs recientes:
pm2 logs gestion-activos-imgc --lines 50
echo.
echo Uso de memoria:
pm2 monit
```

---

## 🐳 PARTE 2: DESPLIEGUE CON DOCKER (ALTERNATIVO)

### 2.1 Dockerfile

Crear archivo `Dockerfile`:

```dockerfile
# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar cliente Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar archivos compilados
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Cambiar permisos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]
```

### 2.2 Docker Compose

Crear archivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Aplicación Next.js
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - app-network

  # SQL Server (opcional - si quieres contenerizar la DB)
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Passw0rd
      - MSSQL_PID=Express
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
    restart: unless-stopped
    networks:
      - app-network

volumes:
  sqlserver_data:

networks:
  app-network:
    driver: bridge
```

### 2.3 Comandos Docker

```bash
# 1. Crear archivo .env para Docker
echo "DATABASE_URL=sqlserver://sa:YourStrong@Passw0rd@db:1433;database=gestion_activos;encrypt=true;trustServerCertificate=true;" > .env
echo "NEXTAUTH_SECRET=tu-clave-secreta-super-segura-de-al-menos-32-caracteres" >> .env

# 2. Construir y ejecutar
docker-compose up --build -d

# 3. Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# 4. Poblar datos iniciales (opcional)
docker-compose exec app npm run seed

# 5. Verificar estado
docker-compose ps
docker-compose logs app

# 6. Comandos útiles
docker-compose down                    # Detener servicios
docker-compose restart app            # Reiniciar aplicación
docker-compose logs -f app            # Ver logs en tiempo real
```

### 2.4 Script de Despliegue Docker

Crear archivo `deploy-docker.bat`:

```batch
@echo off
echo Iniciando despliegue con Docker...

REM Detener servicios existentes
docker-compose down

REM Construir y ejecutar
echo Construyendo y ejecutando servicios...
docker-compose up --build -d

REM Ejecutar migraciones
echo Ejecutando migraciones...
docker-compose exec app npx prisma migrate deploy

REM Poblar datos iniciales
echo Poblando datos iniciales...
docker-compose exec app npm run seed

echo Despliegue Docker completado!
docker-compose ps
pause
```

---

## 🎯 RECOMENDACIÓN FINAL

### **ESTRATEGIA RECOMENDADA: DESPLIEGUE DIRECTO CON PM2**

**Justificación:**

#### ✅ **Ventajas del Despliegue Directo:**
1. **Simplicidad**: Menos capas de abstracción, más fácil de debuggear
2. **Rendimiento**: Sin overhead de contenedores
3. **Mantenimiento**: Herramientas nativas de Windows (Task Manager, Event Viewer)
4. **Recursos**: Menor consumo de RAM y CPU
5. **Desarrollo**: Fácil acceso a logs y debugging
6. **Integración**: Mejor integración con servicios de Windows

#### ❌ **Desventajas de Docker:**
1. **Complejidad**: Configuración adicional para Windows
2. **Recursos**: Mayor consumo de memoria
3. **Debugging**: Más difícil de diagnosticar problemas
4. **Actualizaciones**: Requiere rebuild completo para cambios menores

#### 🔧 **Configuración Recomendada para VM Windows 10:**

```bash
# 1. Instalar Node.js 20 LTS
# 2. Instalar PM2 globalmente
npm install -g pm2

# 3. Configurar variables de entorno
# Crear .env.production con conexión a SQL Server

# 4. Ejecutar despliegue
npm install
npx prisma generate
npm run build
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

#### 📊 **Configuración de Producción Optimizada:**

```javascript
// ecosystem.config.js optimizado para Windows 10
module.exports = {
  apps: [{
    name: 'gestion-activos-imgc',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',  // Optimizado para VM
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=512'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

---

## 🚀 PASOS RÁPIDOS DE DESPLIEGUE

### Para Despliegue Directo (Recomendado):

1. **Preparar entorno:**
   ```bash
   npm install -g pm2
   ```

2. **Configurar variables:**
   - Crear `.env.production` con conexión a SQL Server
   - Ajustar `ecosystem.config.js` con la ruta correcta

3. **Desplegar:**
   ```bash
   npm install
   npx prisma generate
   npm run build
   pm2 start ecosystem.config.js --env production
   pm2 startup
   pm2 save
   ```

4. **Verificar:**
   ```bash
   pm2 status
   pm2 logs gestion-activos-imgc
   ```

### Para Despliegue Docker:

1. **Preparar archivos:**
   - Crear `Dockerfile`
   - Crear `docker-compose.yml`
   - Configurar `.env`

2. **Desplegar:**
   ```bash
   docker-compose up --build -d
   docker-compose exec app npx prisma migrate deploy
   ```

3. **Verificar:**
   ```bash
   docker-compose ps
   docker-compose logs app
   ```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes con SQL Server y Prisma:

#### Error: "Cannot connect to SQL Server"
```bash
# 1. Verificar que SQL Server esté corriendo
sc query MSSQL$SQLEXPRESS

# 2. Verificar conectividad
telnet localhost 1433

# 3. Verificar configuración de Prisma
npx prisma db pull

# 4. Verificar variables de entorno
echo %DATABASE_URL%

# 5. Probar conexión directa
sqlcmd -S localhost\SQLEXPRESS -U gestion_activos_user -P GestionActivos2024! -d gestion_activos_imgc -Q "SELECT @@VERSION"
```

#### Error: "Login failed for user"
```sql
-- Verificar que el usuario existe
SELECT name FROM sys.server_principals WHERE name = 'gestion_activos_user';

-- Verificar que el usuario tiene permisos en la base de datos
USE gestion_activos_imgc;
SELECT name FROM sys.database_principals WHERE name = 'gestion_activos_user';

-- Recrear usuario si es necesario
USE master;
DROP LOGIN gestion_activos_user;
CREATE LOGIN gestion_activos_user WITH PASSWORD = 'GestionActivos2024!';

USE gestion_activos_imgc;
CREATE USER gestion_activos_user FOR LOGIN gestion_activos_user;
ALTER ROLE db_owner ADD MEMBER gestion_activos_user;
```

#### Error: "Database does not exist"
```sql
-- Verificar que la base de datos existe
SELECT name FROM sys.databases WHERE name = 'gestion_activos_imgc';

-- Crear base de datos si no existe
CREATE DATABASE gestion_activos_imgc;
```

#### Error: "Migration failed"
```bash
# 1. Verificar estado de migraciones
npx prisma migrate status

# 2. Resetear migraciones (¡CUIDADO! Esto elimina datos)
npx prisma migrate reset

# 3. Aplicar migraciones manualmente
npx prisma migrate deploy

# 4. Verificar esquema
npx prisma db pull
```

### Problemas Comunes con PM2:

1. **Error de permisos en Windows:**
   ```bash
   # Ejecutar como administrador
   pm2 start ecosystem.config.js --env production
   ```

2. **Puerto ya en uso:**
   ```bash
   # Cambiar puerto en ecosystem.config.js
   env: {
     PORT: 3001
   }
   ```

3. **Memoria insuficiente:**
   ```bash
   # Reducir max_memory_restart en ecosystem.config.js
   max_memory_restart: '256M'
   ```

### Problemas Comunes con Docker:

1. **Error de build:**
   ```bash
   # Limpiar cache y rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build -d
   ```

2. **Error de conexión a DB:**
   ```bash
   # Verificar variables de entorno
   docker-compose exec app env | grep DATABASE
   ```

---

## 📞 SOPORTE

Para problemas específicos:
1. Revisar logs: `pm2 logs` o `docker-compose logs`
2. Verificar variables de entorno
3. Comprobar conectividad a SQL Server
4. Validar permisos de archivos en Windows

**La estrategia de despliegue directo con PM2 es la más adecuada para un entorno de VM Windows 10 por su simplicidad, rendimiento y facilidad de mantenimiento.**

---

## ✅ CHECKLIST DE DESPLIEGUE COMPLETO

### Pre-requisitos:
- [ ] Windows 10 VM configurada
- [ ] Node.js 20 LTS instalado
- [ ] SQL Server 2019 instalado y configurado
- [ ] SQL Server Management Studio (SSMS) instalado
- [ ] Firewall configurado (puertos 1433, 1434)
- [ ] Repositorio clonado en la VM

### Configuración de SQL Server:
- [ ] SQL Server Express 2019 instalado
- [ ] Autenticación mixta habilitada
- [ ] Usuario `gestion_activos_user` creado
- [ ] Base de datos `gestion_activos_imgc` creada
- [ ] Permisos de `db_owner` asignados
- [ ] TCP/IP habilitado
- [ ] Puerto 1433 configurado
- [ ] Firewall configurado para SQL Server

### Configuración de la Aplicación:
- [ ] Variables de entorno `.env.production` configuradas
- [ ] `DATABASE_URL` configurado correctamente
- [ ] `NEXTAUTH_SECRET` configurado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Cliente Prisma generado (`npx prisma generate`)
- [ ] Migraciones aplicadas (`npx prisma migrate deploy`)
- [ ] Datos iniciales poblados (`npm run seed`)
- [ ] Aplicación compilada (`npm run build`)

### Configuración de PM2:
- [ ] PM2 instalado globalmente
- [ ] `ecosystem.config.js` configurado
- [ ] Directorio `logs` creado
- [ ] Aplicación iniciada con PM2
- [ ] PM2 configurado para auto-inicio
- [ ] Configuración guardada (`pm2 save`)

### Verificación Final:
- [ ] Aplicación accesible en `http://localhost:3000`
- [ ] Login funciona correctamente
- [ ] Base de datos conectada y funcionando
- [ ] Dashboard carga datos correctamente
- [ ] Logs de PM2 sin errores
- [ ] Aplicación sobrevive reinicio del servidor

### Scripts de Monitoreo:
- [ ] `deploy.bat` creado y funcional
- [ ] `monitor.bat` creado y funcional
- [ ] Logs configurados y rotativos
- [ ] Monitoreo de memoria configurado

### Backup y Recuperación:
- [ ] Script de backup de base de datos creado
- [ ] Procedimiento de recuperación documentado
- [ ] Backup de configuración de la aplicación
- [ ] Procedimiento de rollback definido

---

## 📞 SOPORTE Y MANTENIMIENTO

### Comandos de Monitoreo Diario:
```bash
# Verificar estado de la aplicación
pm2 status

# Verificar logs recientes
pm2 logs gestion-activos-imgc --lines 50

# Verificar uso de memoria
pm2 monit

# Verificar conectividad a SQL Server
npx prisma db pull

# Verificar estado de migraciones
npx prisma migrate status
```

### Comandos de Mantenimiento:
```bash
# Reiniciar aplicación
pm2 restart gestion-activos-imgc

# Actualizar aplicación
git pull origin main
npm install
npx prisma generate
npm run build
pm2 restart gestion-activos-imgc

# Backup de base de datos
sqlcmd -S localhost\SQLEXPRESS -U sa -P [password] -Q "BACKUP DATABASE gestion_activos_imgc TO DISK = 'C:\backups\gestion_activos_$(Get-Date -Format 'yyyyMMdd').bak'"
```

### Contacto para Soporte:
- **Documentación**: Ver `AGENTS.md` para scripts automatizados
- **Logs**: Revisar `./logs/` para errores específicos
- **Base de Datos**: Usar SSMS para consultas directas
- **Aplicación**: Usar `npx prisma studio` para explorar datos

**¡Despliegue completado exitosamente! La aplicación está lista para producción.**
