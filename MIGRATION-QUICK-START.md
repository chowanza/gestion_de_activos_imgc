# 🚀 Guía Rápida de Migración a Producción

## 📋 Resumen Ejecutivo

Tu aplicación **Sistema de Gestión de Activos IMGC** está lista para migrar a producción. Aquí tienes los pasos esenciales:

## 🎯 Plan de Migración (3 Fases)

### FASE 1: Preparar la VM del Servidor ⚙️

#### 1.1 Conectar a la VM
```bash
# Conectar via SSH a la VM
ssh usuario@IP_VM
```

#### 1.2 Ejecutar script de configuración
```bash
# En la VM, ejecutar:
cd /home/usuario/
# Copiar el script setup-vm.sh a la VM y ejecutar:
chmod +x setup-vm.sh
./setup-vm.sh
```

#### 1.3 Configurar SQL Server
```sql
-- Conectar a SQL Server y ejecutar:
CREATE LOGIN [ventory_user] WITH PASSWORD = 'TuPasswordSegura123!';
CREATE DATABASE [ventory_prod];
USE [ventory_prod];
CREATE USER [ventory_user] FOR LOGIN [ventory_user];
ALTER ROLE db_owner ADD MEMBER [ventory_user];
```

### FASE 2: Migrar Base de Datos 🗄️

#### 2.1 Desde tu máquina Windows
```cmd
# En PowerShell o CMD:
cd C:\Users\luisi\Documents\imgc\gestion_de_activos_imgc

# Crear backup de tu base de datos local
sqlcmd -S localhost -E -Q "BACKUP DATABASE [ventory] TO DISK = 'C:\temp\ventory_backup.bak' WITH FORMAT, INIT"

# Transferir backup a la VM (usar SCP o copia manual)
scp C:\temp\ventory_backup.bak usuario@IP_VM:/backups/
```

#### 2.2 En la VM, restaurar backup
```bash
# Conectar a la VM y restaurar:
ssh usuario@IP_VM
sqlcmd -S localhost -U ventory_user -P TuPasswordSegura123! -Q "
USE [master]
RESTORE DATABASE [ventory_prod] 
FROM DISK = '/backups/ventory_backup.bak'
WITH REPLACE"
```

### FASE 3: Desplegar Aplicación 🚀

#### 3.1 Preparar archivos en tu máquina Windows
```cmd
# Crear archivo de configuración para producción
echo DATABASE_URL="sqlserver://IP_VM:1433;database=ventory_prod;user=ventory_user;password=TuPasswordSegura123!;encrypt=true;trustServerCertificate=true" > .env.production
echo JWT_SECRET_KEY=tu-clave-jwt-super-secreta-para-produccion-muy-larga-y-aleatoria-987654321 >> .env.production
echo NEXT_PUBLIC_URL=http://IP_VM:3000 >> .env.production
echo NODE_ENV=production >> .env.production

# Crear archivo comprimido (excluyendo archivos innecesarios)
# Usar 7-Zip o WinRAR para crear ventory-production.zip excluyendo:
# - node_modules
# - .next
# - .git
# - *.log
# - backups
```

#### 3.2 Transferir y configurar en la VM
```bash
# En la VM:
cd /home/usuario/
# Descomprimir archivo transferido
unzip ventory-production.zip -d gestion_de_activos_imgc
cd gestion_de_activos_imgc

# Configurar
cp .env.production .env
npm install --production
npx prisma generate
npx prisma migrate deploy

# Iniciar aplicación
pm2 start npm --name "ventory-imgc" -- start
pm2 save
pm2 startup  # Seguir instrucciones para auto-inicio
```

## 🔍 Verificación Final

### Verificar que todo funciona:
```bash
# 1. Verificar aplicación
curl http://IP_VM:3000

# 2. Verificar PM2
pm2 status

# 3. Verificar base de datos
sqlcmd -S localhost -U ventory_user -P TuPasswordSegura123! -d ventory_prod -Q "SELECT COUNT(*) FROM Empleado"

# 4. Verificar Nginx
curl http://IP_VM
```

## 📊 Comandos de Monitoreo

### Ver logs de la aplicación:
```bash
pm2 logs ventory-imgc
```

### Reiniciar aplicación:
```bash
pm2 restart ventory-imgc
```

### Ver estado del sistema:
```bash
pm2 status
pm2 monit
```

### Ver logs de Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ Troubleshooting Rápido

### Si la aplicación no inicia:
```bash
# Ver logs de error
pm2 logs ventory-imgc --err

# Verificar variables de entorno
pm2 env 0  # 0 es el ID del proceso
```

### Si hay problemas de base de datos:
```bash
# Verificar conexión
sqlcmd -S localhost -U ventory_user -P TuPasswordSegura123! -Q "SELECT 1"

# Verificar que la base de datos existe
sqlcmd -S localhost -U ventory_user -P TuPasswordSegura123! -Q "SELECT name FROM sys.databases WHERE name = 'ventory_prod'"
```

### Si Nginx no sirve la aplicación:
```bash
# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

## 📁 Archivos Importantes Creados

- `PRODUCTION-DEPLOYMENT-GUIDE.md` - Guía completa detallada
- `scripts/setup-vm.sh` - Script de configuración de VM
- `scripts/migrate-database.sh` - Script de migración de BD
- `scripts/deploy-production.sh` - Script de despliegue automático
- `scripts/check-production.sh` - Script de verificación

## 🎯 URLs de Acceso

- **Aplicación directa**: http://IP_VM:3000
- **A través de Nginx**: http://IP_VM (puerto 80)

## ⚠️ Importante

1. **Cambiar contraseñas**: Usa contraseñas seguras en producción
2. **Configurar SSL**: Considera usar Let's Encrypt para HTTPS
3. **Backups automáticos**: Ya configurados (diarios a las 2:00 AM)
4. **Monitoreo**: Scripts de monitoreo automático cada 5 minutos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs ventory-imgc`
2. Verifica el estado: `pm2 status`
3. Revisa la guía completa: `PRODUCTION-DEPLOYMENT-GUIDE.md`

---

**¡Tu aplicación está lista para producción!** 🎉


