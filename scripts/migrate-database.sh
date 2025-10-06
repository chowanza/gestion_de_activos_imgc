#!/bin/bash

# 🗄️ Script de Migración de Base de Datos - Sistema de Gestión de Activos IMGC
# Este script migra datos desde tu base de datos local a la VM de producción
# Uso: ./migrate-database.sh <IP_VM> <DB_PASSWORD>

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

# Verificar parámetros
if [ $# -lt 2 ]; then
    print_error "Uso: $0 <IP_VM> <DB_PASSWORD>"
    print_error "Ejemplo: $0 192.168.1.100 TuPasswordSegura123!"
    exit 1
fi

VM_IP=$1
DB_PASSWORD=$2
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

print_status "🗄️ Iniciando migración de base de datos..."
print_status "VM IP: $VM_IP"
print_status "Fecha: $(date)"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Verificar que sqlcmd esté disponible
if ! command -v sqlcmd &> /dev/null; then
    print_error "sqlcmd no está instalado. Instálalo desde:"
    print_error "https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility"
    exit 1
fi

# Verificar conexión a base de datos local
print_status "🔍 Verificando conexión a base de datos local..."
if ! sqlcmd -S localhost -d ventory -E -Q "SELECT 1" &>/dev/null; then
    print_error "No se puede conectar a la base de datos local."
    print_error "Verifica que SQL Server esté corriendo y que la base de datos 'ventory' exista."
    exit 1
fi
print_success "Conexión a base de datos local establecida"

# Crear backup de la base de datos local
print_status "📦 Creando backup de la base de datos local..."
BACKUP_FILE="$BACKUP_DIR/ventory_backup_$DATE.bak"
sqlcmd -S localhost -E -Q "BACKUP DATABASE [ventory] TO DISK = '$BACKUP_FILE' WITH FORMAT, INIT"
print_success "Backup local creado: $BACKUP_FILE"

# Verificar que el backup se creó correctamente
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "El archivo de backup no se creó correctamente."
    exit 1
fi

# Obtener información del backup
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
print_success "Tamaño del backup: $BACKUP_SIZE"

# Transferir backup a la VM
print_status "📤 Transferiendo backup a la VM..."
VM_USER="usuario"  # Cambiar por el usuario real de la VM

# Crear directorio de backups en la VM
ssh $VM_USER@$VM_IP "mkdir -p /backups"

# Transferir archivo
scp "$BACKUP_FILE" $VM_USER@$VM_IP:/backups/
print_success "Backup transferido a la VM"

# Restaurar backup en la VM
print_status "🔄 Restaurando backup en la VM..."
ssh $VM_USER@$VM_IP << EOF
set -e

echo "🔄 Iniciando restauración en la VM..."

# Verificar que sqlcmd esté disponible en la VM
if ! command -v sqlcmd &> /dev/null; then
    echo "❌ sqlcmd no está instalado en la VM"
    exit 1
fi

# Verificar que el archivo de backup existe
if [ ! -f "/backups/$(basename $BACKUP_FILE)" ]; then
    echo "❌ Archivo de backup no encontrado en la VM"
    exit 1
fi

# Crear la base de datos si no existe
echo "🗄️ Creando base de datos si no existe..."
sqlcmd -S localhost -U ventory_user -P "$DB_PASSWORD" -Q "
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ventory_prod')
BEGIN
    CREATE DATABASE [ventory_prod]
END
"

# Restaurar la base de datos
echo "🔄 Restaurando base de datos..."
sqlcmd -S localhost -U ventory_user -P "$DB_PASSWORD" -Q "
USE [master]
RESTORE DATABASE [ventory_prod] 
FROM DISK = '/backups/$(basename $BACKUP_FILE)'
WITH REPLACE,
MOVE 'ventory' TO '/var/opt/mssql/data/ventory_prod.mdf',
MOVE 'ventory_log' TO '/var/opt/mssql/data/ventory_prod_log.ldf'
"

echo "✅ Base de datos restaurada exitosamente"
EOF

print_success "Base de datos restaurada en la VM"

# Verificar que la restauración fue exitosa
print_status "🔍 Verificando restauración..."
ssh $VM_USER@$VM_IP << EOF
# Verificar que la base de datos existe y tiene datos
sqlcmd -S localhost -U ventory_user -P "$DB_PASSWORD" -d ventory_prod -Q "
SELECT 
    'Empleados' as Tabla, COUNT(*) as Registros FROM Empleado
UNION ALL
SELECT 
    'Computadores' as Tabla, COUNT(*) as Registros FROM Computador
UNION ALL
SELECT 
    'Dispositivos' as Tabla, COUNT(*) as Registros FROM Dispositivo
UNION ALL
SELECT 
    'Empresas' as Tabla, COUNT(*) as Registros FROM Empresa
UNION ALL
SELECT 
    'Departamentos' as Tabla, COUNT(*) as Registros FROM Departamento
"
EOF

print_success "✅ Migración de base de datos completada exitosamente!"

# Limpiar backup local si se desea
read -p "¿Deseas eliminar el backup local para liberar espacio? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$BACKUP_FILE"
    print_success "Backup local eliminado"
fi

print_status ""
print_status "📋 Resumen de la migración:"
print_status "• Backup creado: $BACKUP_FILE"
print_status "• Tamaño: $BACKUP_SIZE"
print_status "• Restaurado en: $VM_IP (ventory_prod)"
print_status "• Usuario de base de datos: ventory_user"
print_status ""
print_status "🔧 Próximos pasos:"
print_status "1. Ejecuta el script de despliegue de la aplicación"
print_status "2. Verifica que la aplicación se conecte correctamente a la base de datos"
print_status "3. Prueba todas las funcionalidades críticas"
print_status ""
print_status "📊 Para verificar la migración:"
print_status "ssh $VM_USER@$VM_IP 'sqlcmd -S localhost -U ventory_user -P $DB_PASSWORD -d ventory_prod -Q \"SELECT COUNT(*) as TotalEmpleados FROM Empleado\"'"


