# 🔍 Script de Diagnóstico de Conexión SSH
# Ejecutar desde PowerShell en Windows

param(
    [Parameter(Mandatory=$true)]
    [string]$VMHostname,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 22
)

Write-Host "🔍 Diagnosticando conexión SSH a $VMHostname" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Función para imprimir resultados
function Write-Result {
    param($Message, $Success)
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
    }
}

# 1. Verificar conectividad básica
Write-Host "`n1. Verificando conectividad básica..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $VMHostname -Count 1 -Quiet
    Write-Result "Ping a $VMHostname" $ping
} catch {
    Write-Result "Ping a $VMHostname" $false
    Write-Host "   Error: $_" -ForegroundColor Red
}

# 2. Verificar puerto SSH
Write-Host "`n2. Verificando puerto $Port..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $result = $tcpClient.BeginConnect($VMHostname, $Port, $null, $null)
    $success = $result.AsyncWaitHandle.WaitOne(3000, $false)
    
    if ($success) {
        $tcpClient.EndConnect($result)
        $tcpClient.Close()
        Write-Result "Puerto $Port accesible" $true
    } else {
        Write-Result "Puerto $Port no accesible" $false
    }
} catch {
    Write-Result "Puerto $Port no accesible" $false
    Write-Host "   Error: $_" -ForegroundColor Red
}

# 3. Verificar DNS
Write-Host "`n3. Verificando resolución DNS..." -ForegroundColor Yellow
try {
    $dnsResult = [System.Net.Dns]::GetHostAddresses($VMHostname)
    Write-Result "DNS resuelto correctamente" $true
    foreach ($ip in $dnsResult) {
        Write-Host "   IP: $($ip.IPAddressToString)" -ForegroundColor Cyan
    }
} catch {
    Write-Result "DNS no resuelve $VMHostname" $false
    Write-Host "   Error: $_" -ForegroundColor Red
}

# 4. Verificar otros puertos comunes
Write-Host "`n4. Verificando otros puertos comunes..." -ForegroundColor Yellow
$commonPorts = @(80, 443, 3389, 5985, 5986)
foreach ($port in $commonPorts) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($VMHostname, $port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne(2000, $false)
        
        if ($success) {
            $tcpClient.EndConnect($result)
            $tcpClient.Close()
            Write-Result "Puerto $port accesible" $true
        } else {
            Write-Result "Puerto $port no accesible" $false
        }
    } catch {
        Write-Result "Puerto $port no accesible" $false
    }
}

# 5. Sugerencias de solución
Write-Host "`nSUGERENCIAS DE SOLUCION:" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

Write-Host "`n🔧 Si el ping falla:" -ForegroundColor Yellow
Write-Host "   • Verifica que la VM esté encendida"
Write-Host "   • Verifica la IP/hostname de la VM"
Write-Host "   • Verifica la conectividad de red"

Write-Host "`n🔧 Si el ping funciona pero SSH no:" -ForegroundColor Yellow
Write-Host "   • SSH no está instalado en la VM"
Write-Host "   • SSH está deshabilitado"
Write-Host "   • Firewall bloquea el puerto 22"
Write-Host "   • SSH está en un puerto diferente"

Write-Host "`n🔧 Soluciones:" -ForegroundColor Yellow
Write-Host "   1. Conectar por RDP/VNC a la VM y habilitar SSH"
Write-Host "   2. Instalar OpenSSH Server en la VM"
Write-Host "   3. Configurar firewall para permitir puerto 22"
Write-Host "   4. Verificar que SSH esté en el puerto correcto"

Write-Host "`n🔧 Comandos para ejecutar en la VM:" -ForegroundColor Yellow
Write-Host "   sudo apt update && sudo apt install openssh-server"
Write-Host "   sudo systemctl enable ssh && sudo systemctl start ssh"
Write-Host "   sudo ufw allow ssh"

Write-Host "`n📞 Si necesitas ayuda adicional:" -ForegroundColor Cyan
Write-Host "   • Verifica con el administrador de red"
Write-Host "   • Revisa la configuración de la VM"
Write-Host "   • Considera usar RDP en lugar de SSH"
