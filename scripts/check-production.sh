#!/bin/bash

# 🔍 Script de Verificación de Producción - Sistema de Gestión de Activos IMGC
# Este script verifica que todos los componentes estén funcionando correctamente
# Uso: ./check-production.sh <IP_VM> <DB_PASSWORD>

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
VM_USER="usuario"  # Cambiar por el usuario real de la VM

print_status "🔍 Iniciando verificación de producción..."
print_status "VM IP: $VM_IP"
print_status "Fecha: $(date)"

# Función para verificar conectividad
check_connectivity() {
    print_status "🌐 Verificando conectividad a la VM..."
    if ping -c 1 $VM_IP &>/dev/null; then
        print_success "VM accesible via ping"
    else
        print_error "VM no accesible via ping"
        return 1
    fi
}

# Función para verificar SSH
check_ssh() {
    print_status "🔑 Verificando acceso SSH..."
    if ssh -o ConnectTimeout=10 $VM_USER@$VM_IP "echo 'SSH OK'" &>/dev/null; then
        print_success "Acceso SSH funcionando"
    else
        print_error "No se puede acceder via SSH"
        return 1
    fi
}

# Función para verificar servicios en la VM
check_services() {
    print_status "🔧 Verificando servicios en la VM..."
    
    ssh $VM_USER@$VM_IP << 'EOF'
echo "📊 Verificando servicios del sistema..."

# Verificar SQL Server
if systemctl is-active --quiet mssql-server; then
    echo "✅ SQL Server está corriendo"
else
    echo "❌ SQL Server no está corriendo"
fi

# Verificar Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx está corriendo"
else
    echo "❌ Nginx no está corriendo"
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 está instalado"
    pm2 status
else
    echo "❌ PM2 no está instalado"
fi
EOF
}

# Función para verificar base de datos
check_database() {
    print_status "🗄️ Verificando base de datos..."
    
    ssh $VM_USER@$VM_IP << EOF
# Verificar conexión a la base de datos
if sqlcmd -S localhost -U ventory_user -P "$DB_PASSWORD" -d ventory_prod -Q "SELECT 1" &>/dev/null; then
    echo "✅ Conexión a base de datos exitosa"
    
    # Verificar estructura de la base de datos
    echo "📊 Verificando estructura de la base de datos..."
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
    UNION ALL
    SELECT 
        'Usuarios' as Tabla, COUNT(*) as Registros FROM Usuario
    "
else
    echo "❌ Error de conexión a base de datos"
fi
EOF
}

# Función para verificar aplicación
check_application() {
    print_status "🚀 Verificando aplicación..."
    
    # Verificar que la aplicación responda
    if curl -f -s http://$VM_IP:3000 > /dev/null; then
        print_success "Aplicación respondiendo en puerto 3000"
    else
        print_error "Aplicación no responde en puerto 3000"
        return 1
    fi
    
    # Verificar que Nginx esté sirviendo la aplicación
    if curl -f -s http://$VM_IP > /dev/null; then
        print_success "Nginx sirviendo la aplicación correctamente"
    else
        print_error "Nginx no está sirviendo la aplicación"
        return 1
    fi
    
    # Verificar endpoints críticos
    print_status "🔍 Verificando endpoints críticos..."
    
    # Verificar endpoint de login
    if curl -f -s http://$VM_IP/api/auth/session > /dev/null; then
        print_success "Endpoint de autenticación funcionando"
    else
        print_warning "Endpoint de autenticación no responde correctamente"
    fi
    
    # Verificar endpoint de empresas
    if curl -f -s http://$VM_IP/api/empresas > /dev/null; then
        print_success "Endpoint de empresas funcionando"
    else
        print_warning "Endpoint de empresas no responde correctamente"
    fi
}

# Función para verificar logs
check_logs() {
    print_status "📝 Verificando logs..."
    
    ssh $VM_USER@$VM_IP << 'EOF'
echo "📊 Estado de PM2:"
pm2 status

echo ""
echo "📝 Últimas líneas del log de la aplicación:"
pm2 logs ventory-imgc --lines 10

echo ""
echo "📝 Últimas líneas del log de Nginx:"
sudo tail -5 /var/log/nginx/access.log
sudo tail -5 /var/log/nginx/error.log
EOF
}

# Función para verificar recursos del sistema
check_resources() {
    print_status "💻 Verificando recursos del sistema..."
    
    ssh $VM_USER@$VM_IP << 'EOF'
echo "💾 Uso de memoria:"
free -h

echo ""
echo "💽 Uso de disco:"
df -h

echo ""
echo "⚡ Uso de CPU:"
top -bn1 | grep "Cpu(s)"

echo ""
echo "🔄 Procesos de Node.js:"
ps aux | grep node | grep -v grep
EOF
}

# Función para verificar seguridad
check_security() {
    print_status "🔒 Verificando configuración de seguridad..."
    
    ssh $VM_USER@$VM_IP << 'EOF'
echo "🔒 Estado del firewall:"
sudo ufw status

echo ""
echo "🔍 Puertos abiertos:"
sudo netstat -tlnp | grep -E ':(22|80|443|3000)'

echo ""
echo "📁 Permisos de archivos críticos:"
ls -la /home/$USER/gestion_de_activos_imgc/.env
ls -la /etc/nginx/sites-available/ventory-imgc
EOF
}

# Función para generar reporte
generate_report() {
    print_status "📊 Generando reporte de verificación..."
    
    REPORT_FILE="production-check-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
========================================
REPORTE DE VERIFICACIÓN DE PRODUCCIÓN
Sistema de Gestión de Activos IMGC
========================================

Fecha: $(date)
VM IP: $VM_IP
Usuario VM: $VM_USER

========================================
VERIFICACIONES REALIZADAS:
========================================

1. CONECTIVIDAD
- Ping a VM: $(ping -c 1 $VM_IP &>/dev/null && echo "✅ OK" || echo "❌ FALLO")
- SSH: $(ssh -o ConnectTimeout=5 $VM_USER@$VM_IP "echo OK" &>/dev/null && echo "✅ OK" || echo "❌ FALLO")

2. SERVICIOS
$(ssh $VM_USER@$VM_IP "systemctl is-active --quiet mssql-server && echo 'SQL Server: ✅ OK' || echo 'SQL Server: ❌ FALLO'; systemctl is-active --quiet nginx && echo 'Nginx: ✅ OK' || echo 'Nginx: ❌ FALLO'")

3. APLICACIÓN
- Puerto 3000: $(curl -f -s http://$VM_IP:3000 &>/dev/null && echo "✅ OK" || echo "❌ FALLO")
- Nginx (puerto 80): $(curl -f -s http://$VM_IP &>/dev/null && echo "✅ OK" || echo "❌ FALLO")

4. BASE DE DATOS
$(ssh $VM_USER@$VM_IP "sqlcmd -S localhost -U ventory_user -P '$DB_PASSWORD' -d ventory_prod -Q 'SELECT 1' &>/dev/null && echo 'Conexión: ✅ OK' || echo 'Conexión: ❌ FALLO'")

5. RECURSOS DEL SISTEMA
$(ssh $VM_USER@$VM_IP "free -h | grep Mem; df -h | grep -E '(/$|/home)'; echo 'CPU:'; top -bn1 | grep 'Cpu(s)'")

========================================
COMANDOS ÚTILES PARA MONITOREO:
========================================

# Ver estado de la aplicación
ssh $VM_USER@$VM_IP 'pm2 status'

# Ver logs de la aplicación
ssh $VM_USER@$VM_IP 'pm2 logs ventory-imgc'

# Reiniciar aplicación
ssh $VM_USER@$VM_IP 'pm2 restart ventory-imgc'

# Ver logs de Nginx
ssh $VM_USER@$VM_IP 'sudo tail -f /var/log/nginx/error.log'

# Verificar base de datos
ssh $VM_USER@$VM_IP 'sqlcmd -S localhost -U ventory_user -P "$DB_PASSWORD" -d ventory_prod -Q "SELECT COUNT(*) FROM Empleado"'

========================================
EOF

    print_success "Reporte generado: $REPORT_FILE"
}

# Ejecutar todas las verificaciones
main() {
    echo "🔍 VERIFICACIÓN COMPLETA DE PRODUCCIÓN"
    echo "======================================"
    echo ""
    
    check_connectivity
    check_ssh
    check_services
    check_database
    check_application
    check_logs
    check_resources
    check_security
    generate_report
    
    echo ""
    print_success "🎉 Verificación completada!"
    print_status "Revisa el reporte generado para detalles completos."
}

# Ejecutar función principal
main


