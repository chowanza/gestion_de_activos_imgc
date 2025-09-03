# Guía de Migración: PostgreSQL → SQL Server

## 📋 Resumen
Esta guía te ayudará a migrar tu proyecto VENTORY de PostgreSQL a SQL Server para despliegue en servidor local.

## 🎯 Objetivos
- ✅ Migrar base de datos a SQL Server
- ✅ Mantener todos los datos existentes
- ✅ Configurar para despliegue en servidor local
- ✅ Probar funcionalidad completa

## 📦 Prerrequisitos
- Windows Server o Windows 10/11
- Node.js 18+ instalado
- Acceso administrativo al servidor

## 🚀 Paso a Paso

### 1. Instalar SQL Server

#### Opción A: SQL Server Express (Recomendado para desarrollo)
1. Descargar desde: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Seleccionar **"Express"** (gratuito)
3. Durante instalación:
   - Tipo: **"Basic"**
   - Contraseña SA: **Anotar esta contraseña**
   - Puerto: **1433** (por defecto)

#### Opción B: Docker (Más rápido)
```powershell
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=TuPassword123!" -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Crear Base de Datos
```sql
-- Conectar con SQL Server Management Studio o sqlcmd
CREATE DATABASE ventory;
```

### 3. Configurar Variables de Entorno
Crear/actualizar archivo `.env`:
```bash
# SQL Server Configuration
DATABASE_URL="sqlserver://localhost:1433;database=ventory;user=sa;password=TuPassword123!;encrypt=true;trustServerCertificate=true"
JWT_SECRET_KEY=mi-clave-super-secreta-para-jwt-muy-larga-y-aleatoria-123456789
NEXT_PUBLIC_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: Reemplazar `TuPassword123!` con tu contraseña real.

### 4. Generar Cliente Prisma
```powershell
npx prisma generate
```

### 5. Aplicar Migraciones
```powershell
npx prisma migrate dev --name "init-sqlserver"
```

### 6. Migrar Datos Existentes
```powershell
# Primero, actualizar las URLs en migrate-to-sqlserver.js
node migrate-to-sqlserver.js
```

### 7. Verificar Migración
```powershell
# Abrir Prisma Studio
npx prisma studio

# O verificar con consulta
npx prisma db seed
```

### 8. Probar Aplicación
```powershell
npm run dev
```

## 🔧 Configuraciones Adicionales

### Para Servidor de Producción

#### 1. Configurar SQL Server para Producción
```sql
-- Habilitar autenticación mixta
-- Configurar firewall para puerto 1433
-- Crear usuario específico para la aplicación
CREATE LOGIN ventory_user WITH PASSWORD = 'StrongPassword123!';
USE ventory;
CREATE USER ventory_user FOR LOGIN ventory_user;
ALTER ROLE db_owner ADD MEMBER ventory_user;
```

#### 2. Variables de Entorno de Producción
```bash
DATABASE_URL="sqlserver://servidor:1433;database=ventory;user=ventory_user;password=StrongPassword123!;encrypt=true;trustServerCertificate=true"
JWT_SECRET_KEY=clave-super-secreta-para-produccion
NEXT_PUBLIC_URL=https://tu-servidor.com
```

#### 3. Configurar IIS (Opcional)
- Instalar IIS con soporte para Node.js
- Configurar reverse proxy
- Configurar SSL

## 🐛 Solución de Problemas

### Error de Conexión
```
Error: Login failed for user 'sa'
```
**Solución**: Verificar contraseña y que SQL Server esté ejecutándose.

### Error de Certificado
```
Error: certificate verify failed
```
**Solución**: Agregar `trustServerCertificate=true` a la cadena de conexión.

### Error de Puerto
```
Error: Connection timeout
```
**Solución**: Verificar que el puerto 1433 esté abierto en el firewall.

### Error de Migración
```
Error: Table already exists
```
**Solución**: Eliminar base de datos y recrear, o usar `--force` en migraciones.

## 📊 Comparación de Rendimiento

| Aspecto | PostgreSQL | SQL Server |
|---------|------------|------------|
| **Licencia** | Gratuito | Express: Gratuito |
| **Rendimiento** | Excelente | Excelente |
| **Herramientas** | pgAdmin | SSMS (más completo) |
| **Integración Windows** | Buena | Excelente |
| **Backup/Restore** | Bueno | Excelente |
| **Escalabilidad** | Excelente | Excelente |

## ✅ Checklist de Migración

- [ ] SQL Server instalado y configurado
- [ ] Base de datos `ventory` creada
- [ ] Variables de entorno actualizadas
- [ ] Schema de Prisma actualizado
- [ ] Cliente Prisma regenerado
- [ ] Migraciones aplicadas
- [ ] Datos migrados exitosamente
- [ ] Aplicación probada
- [ ] Login funcionando
- [ ] Todas las funcionalidades verificadas

## 🎉 ¡Migración Completada!

Una vez completados todos los pasos, tu aplicación estará ejecutándose con SQL Server y lista para despliegue en servidor local.

### Próximos Pasos
1. **Configurar backup automático** de SQL Server
2. **Configurar monitoreo** de la base de datos
3. **Documentar** el proceso para el equipo
4. **Capacitar** al equipo en SQL Server Management Studio

