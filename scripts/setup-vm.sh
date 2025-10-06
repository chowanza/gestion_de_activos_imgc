#!/bin/bash

# 🛠️ Script de Configuración Inicial de VM - Sistema de Gestión de Activos IMGC
# Este script debe ejecutarse en la VM del servidor de la empresa
# Uso: ./setup-vm.sh

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🛠️ Configurando VM para Sistema de Gestión de Activos IMGC..."

# Verificar si estamos en Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    print_error "Este script está diseñado para Ubuntu/Debian. Ajusta según tu distribución."
    exit 1
fi

# Actualizar sistema
print_status "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y
print_success "Sistema actualizado"

# Instalar Node.js 18 LTS
print_status "📦 Instalando Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
print_success "Node.js $(node --version) instalado"

# Instalar herramientas adicionales
print_status "📦 Instalando herramientas adicionales..."
sudo apt install -y curl wget git unzip nginx ufw sqlcmd
print_success "Herramientas adicionales instaladas"

# Instalar PM2 globalmente
print_status "📦 Instalando PM2..."
sudo npm install -g pm2
print_success "PM2 instalado"

# Configurar SQL Server para la aplicación
print_status "🗄️ Configurando SQL Server para la aplicación..."

# Crear usuario y base de datos (ajustar según tu configuración)
print_warning "⚠️ IMPORTANTE: Ajusta estos comandos según tu configuración de SQL Server"
print_warning "Ejecuta estos comandos SQL manualmente:"
echo ""
echo "-- Crear usuario para la aplicación"
echo "CREATE LOGIN [ventory_user] WITH PASSWORD = 'TuPasswordSegura123!';"
echo "CREATE DATABASE [ventory_prod];"
echo "USE [ventory_prod];"
echo "CREATE USER [ventory_user] FOR LOGIN [ventory_user];"
echo "ALTER ROLE db_owner ADD MEMBER [ventory_user];"
echo ""

read -p "¿Has configurado SQL Server? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Configura SQL Server antes de continuar y ejecuta este script nuevamente."
    exit 1
fi

# Configurar firewall
print_status "🔒 Configurando firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
print_success "Firewall configurado"

# Crear directorio de backups
print_status "📁 Creando directorio de backups..."
sudo mkdir -p /backups
sudo chown $USER:$USER /backups
print_success "Directorio de backups creado"

# Configurar Nginx
print_status "🌐 Configurando Nginx..."

# Obtener IP de la VM
VM_IP=$(hostname -I | awk '{print $1}')

sudo cat > /etc/nginx/sites-available/ventory-imgc << EOF
server {
    listen 80;
    server_name $VM_IP;

    # Configuración para archivos estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Configuración para API y aplicación
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configuración para archivos de upload
    client_max_body_size 50M;
}
EOF

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/ventory-imgc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
print_success "Nginx configurado"

# Crear script de backup automático
print_status "📦 Creando script de backup automático..."
cat > /home/$USER/backup-daily.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_NAME="ventory-imgc"

echo "🔄 Iniciando backup del $(date)"

# Backup de la base de datos
echo "📦 Creando backup de la base de datos..."
sqlcmd -S localhost -d ventory_prod -U ventory_user -P "$DB_PASSWORD" -Q "BACKUP DATABASE ventory_prod TO DISK = '$BACKUP_DIR/ventory_backup_$DATE.bak'"

if [ $? -eq 0 ]; then
    echo "✅ Backup de base de datos completado"
else
    echo "❌ Error en backup de base de datos"
    exit 1
fi

# Backup de archivos de la aplicación
echo "📁 Creando backup de archivos de aplicación..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /home/$USER gestion_de_activos_imgc --exclude=node_modules --exclude=.next

# Mantener solo los últimos 7 backups
echo "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -name "ventory_backup_*.bak" -mtime +7 -delete
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup completado: $DATE"
EOF

chmod +x /home/$USER/backup-daily.sh
print_success "Script de backup creado"

# Configurar backup automático en crontab
print_status "⏰ Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup-daily.sh >> /home/$USER/backup.log 2>&1") | crontab -
print_success "Backup automático configurado (diario a las 2:00 AM)"

# Crear script de monitoreo
print_status "📊 Creando script de monitoreo..."
cat > /home/$USER/monitor-app.sh << 'EOF'
#!/bin/bash

APP_NAME="ventory-imgc"
LOG_FILE="/home/$USER/monitor.log"

echo "🔍 Monitoreo de aplicación - $(date)" >> $LOG_FILE

# Verificar si PM2 está corriendo
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 no está instalado" >> $LOG_FILE
    exit 1
fi

# Verificar estado de la aplicación
pm2_status=$(pm2 jlist | jq -r '.[] | select(.name=="'$APP_NAME'") | .pm2_env.status' 2>/dev/null)

if [ "$pm2_status" = "online" ]; then
    echo "✅ Aplicación $APP_NAME está online" >> $LOG_FILE
else
    echo "❌ Aplicación $APP_NAME está offline, reiniciando..." >> $LOG_FILE
    pm2 restart $APP_NAME
fi

# Verificar uso de memoria
memory_usage=$(pm2 jlist | jq -r '.[] | select(.name=="'$APP_NAME'") | .monit.memory' 2>/dev/null)
echo "💾 Uso de memoria: $memory_usage bytes" >> $LOG_FILE

# Verificar conexión a la base de datos
if sqlcmd -S localhost -d ventory_prod -U ventory_user -P "$DB_PASSWORD" -Q "SELECT 1" &>/dev/null; then
    echo "✅ Conexión a base de datos OK" >> $LOG_FILE
else
    echo "❌ Error de conexión a base de datos" >> $LOG_FILE
fi

echo "---" >> $LOG_FILE
EOF

chmod +x /home/$USER/monitor-app.sh
print_success "Script de monitoreo creado"

# Configurar monitoreo automático
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/$USER/monitor-app.sh") | crontab -
print_success "Monitoreo automático configurado (cada 5 minutos)"

# Crear archivo de configuración PM2
print_status "⚙️ Creando configuración PM2..."
cat > /home/$USER/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ventory-imgc',
    script: 'npm',
    args: 'start',
    cwd: '/home/$USER/gestion_de_activos_imgc',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/$USER/logs/ventory-imgc-error.log',
    out_file: '/home/$USER/logs/ventory-imgc-out.log',
    log_file: '/home/$USER/logs/ventory-imgc-combined.log',
    time: true
  }]
};
EOF

# Crear directorio de logs
mkdir -p /home/$USER/logs
print_success "Configuración PM2 creada"

# Instalar jq para monitoreo
sudo apt install -y jq
print_success "jq instalado para monitoreo"

print_success "🎉 Configuración de VM completada!"
print_status ""
print_status "📋 Resumen de la configuración:"
print_status "• Node.js $(node --version) instalado"
print_status "• PM2 instalado para gestión de procesos"
print_status "• Nginx configurado como proxy reverso"
print_status "• Firewall configurado (puertos 22, 80, 443)"
print_status "• Backup automático configurado (diario a las 2:00 AM)"
print_status "• Monitoreo automático configurado (cada 5 minutos)"
print_status "• Directorio de backups: /backups"
print_status "• Logs de aplicación: /home/$USER/logs/"
print_status ""
print_status "🔧 Próximos pasos:"
print_status "1. Configura SQL Server con el usuario 'ventory_user'"
print_status "2. Ejecuta el script de despliegue desde tu máquina local"
print_status "3. Verifica que la aplicación esté funcionando"
print_status ""
print_status "📊 Comandos útiles:"
print_status "• Ver estado: pm2 status"
print_status "• Ver logs: pm2 logs ventory-imgc"
print_status "• Monitoreo: pm2 monit"
print_status "• Ver logs de monitoreo: tail -f /home/$USER/monitor.log"
print_status "• Ver logs de backup: tail -f /home/$USER/backup.log"


