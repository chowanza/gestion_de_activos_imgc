#!/bin/bash

# 🚀 Script de Despliegue a Producción - Sistema de Gestión de Activos IMGC
# Uso: ./deploy-production.sh [IP_VM] [DB_PASSWORD]

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
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

# Verificar parámetros
if [ $# -lt 2 ]; then
    print_error "Uso: $0 <IP_VM> <DB_PASSWORD>"
    print_error "Ejemplo: $0 192.168.1.100 TuPasswordSegura123!"
    exit 1
fi

VM_IP=$1
DB_PASSWORD=$2
VM_USER="usuario"  # Cambiar por el usuario real de la VM
APP_NAME="ventory-imgc"
BACKUP_DIR="/backups"

print_status "🚀 Iniciando despliegue a producción..."
print_status "VM IP: $VM_IP"
print_status "Usuario VM: $VM_USER"

# Verificar conexión a la VM
print_status "🔍 Verificando conexión a la VM..."
if ! ssh -o ConnectTimeout=10 $VM_USER@$VM_IP "echo 'Conexión exitosa'" 2>/dev/null; then
    print_error "No se puede conectar a la VM. Verifica:"
    print_error "1. La IP de la VM es correcta"
    print_error "2. SSH está habilitado en la VM"
    print_error "3. Las credenciales son correctas"
    exit 1
fi
print_success "Conexión a VM establecida"

# Crear archivo de configuración para producción
print_status "📝 Creando configuración de producción..."
cat > .env.production << EOF
DATABASE_URL="sqlserver://$VM_IP:1433;database=ventory_prod;user=ventory_user;password=$DB_PASSWORD;encrypt=true;trustServerCertificate=true"
JWT_SECRET_KEY=tu-clave-jwt-super-secreta-para-produccion-muy-larga-y-aleatoria-987654321
NEXT_PUBLIC_URL=http://$VM_IP:3000
NODE_ENV=production
EOF
print_success "Archivo .env.production creado"

# Crear archivo comprimido
print_status "📦 Creando archivo comprimido..."
tar -czf ventory-production.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=*.log \
  --exclude=backups \
  --exclude=.env.local \
  --exclude=.env.development \
  .
print_success "Archivo comprimido creado: ventory-production.tar.gz"

# Transferir archivos a la VM
print_status "📤 Transferiendo archivos a la VM..."
scp ventory-production.tar.gz $VM_USER@$VM_IP:/home/$VM_USER/
print_success "Archivos transferidos"

# Ejecutar comandos en la VM
print_status "🔧 Configurando aplicación en la VM..."

ssh $VM_USER@$VM_IP << EOF
set -e

echo "📂 Preparando directorio de la aplicación..."
cd /home/$VM_USER/
rm -rf gestion_de_activos_imgc_old
if [ -d "gestion_de_activos_imgc" ]; then
    mv gestion_de_activos_imgc gestion_de_activos_imgc_old
fi

echo "📦 Descomprimiendo aplicación..."
tar -xzf ventory-production.tar.gz
cd gestion_de_activos_imgc

echo "📝 Configurando variables de entorno..."
cp .env.production .env

echo "📦 Instalando dependencias..."
npm install --production

echo "🗄️ Configurando base de datos..."
npx prisma generate
npx prisma migrate deploy

echo "🔄 Reiniciando aplicación..."
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

echo "🚀 Iniciando aplicación..."
pm2 start npm --name "$APP_NAME" -- start
pm2 save

echo "📊 Verificando estado..."
pm2 status
EOF

print_success "Configuración en VM completada"

# Verificar que la aplicación esté funcionando
print_status "🔍 Verificando que la aplicación esté funcionando..."
sleep 10  # Esperar a que la aplicación inicie

if curl -f -s http://$VM_IP:3000 > /dev/null; then
    print_success "✅ Aplicación funcionando correctamente en http://$VM_IP:3000"
else
    print_warning "⚠️ La aplicación podría no estar funcionando. Verifica manualmente."
    print_warning "Puedes verificar con: ssh $VM_USER@$VM_IP 'pm2 logs $APP_NAME'"
fi

# Limpiar archivos temporales
print_status "🧹 Limpiando archivos temporales..."
rm -f ventory-production.tar.gz .env.production

print_success "🎉 Despliegue completado exitosamente!"
print_status "📍 Aplicación disponible en: http://$VM_IP:3000"
print_status "📊 Para monitorear: ssh $VM_USER@$VM_IP 'pm2 monit'"
print_status "📝 Para ver logs: ssh $VM_USER@$VM_IP 'pm2 logs $APP_NAME'"


