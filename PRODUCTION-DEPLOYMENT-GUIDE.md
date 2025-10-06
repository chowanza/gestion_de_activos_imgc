# 🚀 Guía de Migración a Producción - Sistema de Gestión de Activos IMGC

## 📋 Resumen de la Migración

Tu aplicación está configurada con:
- **Base de datos**: SQL Server 2019 (ya instalado en la VM)
- **Framework**: Next.js 15 con Prisma ORM
- **Autenticación**: JWT personalizado
- **Contenedorización**: Docker (opcional)

## 🎯 Plan de Migración Completo

### FASE 1: Preparación del Servidor VM

#### 1.1 Verificar SQL Server en la VM
```bash
# Conectar a la VM y verificar SQL Server
sqlcmd -S localhost -E -Q "SELECT @@VERSION"
```

#### 1.2 Configurar SQL Server para la aplicación
```sql
-- Crear usuario específico para la aplicación (recomendado)
CREATE LOGIN [ventory_user] WITH PASSWORD = 'TuPasswordSegura123!';
CREATE DATABASE [ventory_prod];
USE [ventory_prod];
CREATE USER [ventory_user] FOR LOGIN [ventory_user];
ALTER ROLE db_owner ADD MEMBER [ventory_user];
```

#### 1.3 Instalar Node.js en la VM
```bash
# Descargar e instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

### FASE 2: Preparación del Código para Producción

#### 2.1 Crear archivo de configuración para producción
```bash
# Crear .env.production en tu máquina local
cp sqlserver-config.txt .env.production
```

#### 2.2 Configurar variables de entorno para producción
```env
# .env.production
DATABASE_URL="sqlserver://IP_VM:1433;database=ventory_prod;user=ventory_user;password=TuPasswordSegura123!;encrypt=true;trustServerCertificate=true"
JWT_SECRET_KEY=tu-clave-jwt-super-secreta-para-produccion-muy-larga-y-aleatoria-987654321
NEXT_PUBLIC_URL=http://IP_VM:3000
NODE_ENV=production
```

#### 2.3 Optimizar para producción
```bash
# En tu máquina local, crear build optimizado
npm run build
```

### FASE 3: Transferencia de Archivos

#### 3.1 Comprimir la aplicación
```bash
# Crear archivo comprimido excluyendo archivos innecesarios
tar -czf ventory-production.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=*.log \
  --exclude=backups \
  .
```

#### 3.2 Transferir a la VM
```bash
# Opción 1: SCP (si tienes acceso SSH)
scp ventory-production.tar.gz usuario@IP_VM:/home/usuario/

# Opción 2: USB/Red compartida
# Copiar el archivo a un USB o carpeta compartida
```

### FASE 4: Configuración en la VM

#### 4.1 Descomprimir y configurar
```bash
# En la VM
cd /home/usuario/
tar -xzf ventory-production.tar.gz
cd gestion_de_activos_imgc

# Instalar dependencias
npm install --production

# Copiar configuración de producción
cp .env.production .env
```

#### 4.2 Configurar la base de datos
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Cargar datos iniciales (opcional)
npm run seed
```

### FASE 5: Configuración del Servidor Web

#### 5.1 Instalar PM2 para gestión de procesos
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Crear archivo de configuración PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ventory-imgc',
    script: 'npm',
    args: 'start',
    cwd: '/home/usuario/gestion_de_activos_imgc',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF
```

#### 5.2 Configurar Nginx como proxy reverso
```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Crear configuración para la aplicación
sudo cat > /etc/nginx/sites-available/ventory-imgc << EOF
server {
    listen 80;
    server_name IP_VM;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/ventory-imgc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### FASE 6: Inicio y Verificación

#### 6.1 Iniciar la aplicación
```bash
# Iniciar con PM2
pm2 start ecosystem.config.js

# Verificar estado
pm2 status
pm2 logs ventory-imgc
```

#### 6.2 Configurar inicio automático
```bash
# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar con el sistema
pm2 startup
# Seguir las instrucciones que aparezcan
```

### FASE 7: Migración de Datos (si es necesario)

#### 7.1 Backup de datos actuales
```bash
# En tu máquina local
sqlcmd -S localhost -d ventory -E -Q "BACKUP DATABASE ventory TO DISK = 'C:\\temp\\ventory_backup.bak'"
```

#### 7.2 Restaurar en la VM
```bash
# En la VM
sqlcmd -S localhost -d ventory_prod -U ventory_user -P TuPasswordSegura123! -Q "RESTORE DATABASE ventory_prod FROM DISK = '/path/to/ventory_backup.bak'"
```

## 🔧 Scripts de Automatización

### Script de Despliegue Automático
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando despliegue de VENTORY IMGC..."

# Detener aplicación actual
pm2 stop ventory-imgc

# Backup de la base de datos actual
echo "📦 Creando backup de la base de datos..."
sqlcmd -S localhost -d ventory_prod -U ventory_user -P $DB_PASSWORD -Q "BACKUP DATABASE ventory_prod TO DISK = '/backups/ventory_backup_$(date +%Y%m%d_%H%M%S).bak'"

# Actualizar código
echo "📥 Actualizando código..."
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy

# Reiniciar aplicación
echo "🔄 Reiniciando aplicación..."
pm2 restart ventory-imgc

echo "✅ Despliegue completado!"
pm2 status
```

## 🛡️ Configuración de Seguridad

### Firewall
```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (si usas SSL)
sudo ufw enable
```

### SSL con Let's Encrypt (recomendado)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com
```

## 📊 Monitoreo y Mantenimiento

### Logs de la aplicación
```bash
# Ver logs en tiempo real
pm2 logs ventory-imgc

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup automático
```bash
# Crear script de backup diario
cat > /home/usuario/backup-daily.sh << EOF
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
sqlcmd -S localhost -d ventory_prod -U ventory_user -P $DB_PASSWORD -Q "BACKUP DATABASE ventory_prod TO DISK = '$BACKUP_DIR/ventory_backup_$DATE.bak'"
# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "ventory_backup_*.bak" -mtime +7 -delete
EOF

chmod +x /home/usuario/backup-daily.sh

# Agregar al crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /home/usuario/backup-daily.sh") | crontab -
```

## 🚨 Troubleshooting Común

### Problemas de conexión a SQL Server
```bash
# Verificar que SQL Server esté corriendo
sudo systemctl status mssql-server

# Verificar conectividad
sqlcmd -S localhost -U ventory_user -P TuPasswordSegura123! -Q "SELECT 1"
```

### Problemas de memoria
```bash
# Verificar uso de memoria
free -h
pm2 monit

# Ajustar límite de memoria en PM2 si es necesario
```

### Problemas de permisos
```bash
# Asegurar permisos correctos
sudo chown -R usuario:usuario /home/usuario/gestion_de_activos_imgc
chmod +x /home/usuario/gestion_de_activos_imgc/package.json
```

## 📞 Contacto y Soporte

- **Documentación**: Este archivo y README.md
- **Logs**: `pm2 logs ventory-imgc`
- **Estado**: `pm2 status`
- **Base de datos**: SQL Server Management Studio o sqlcmd

---

**¡Importante!** Asegúrate de cambiar todas las contraseñas por defecto y configurar SSL en producción para mayor seguridad.


