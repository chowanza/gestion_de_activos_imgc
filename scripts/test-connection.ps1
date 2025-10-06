# Test de conexion SSH a la VM
param([string]$VMHostname = "imgcve")

Write-Host "Probando conexion a $VMHostname..." -ForegroundColor Blue

# Test ping
Write-Host "`n1. Probando ping..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $VMHostname -Count 1 -Quiet
    if ($ping) {
        Write-Host "✅ Ping exitoso" -ForegroundColor Green
    } else {
        Write-Host "❌ Ping fallido" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error en ping: $_" -ForegroundColor Red
}

# Test puerto 22
Write-Host "`n2. Probando puerto 22..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $result = $tcpClient.BeginConnect($VMHostname, 22, $null, $null)
    $success = $result.AsyncWaitHandle.WaitOne(3000, $false)
    
    if ($success) {
        $tcpClient.EndConnect($result)
        $tcpClient.Close()
        Write-Host "✅ Puerto 22 accesible" -ForegroundColor Green
    } else {
        Write-Host "❌ Puerto 22 no accesible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error en puerto 22: $_" -ForegroundColor Red
}

# Test otros puertos
Write-Host "`n3. Probando otros puertos..." -ForegroundColor Yellow
$ports = @(80, 3389, 5985)
foreach ($port in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($VMHostname, $port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne(2000, $false)
        
        if ($success) {
            $tcpClient.EndConnect($result)
            $tcpClient.Close()
            Write-Host "✅ Puerto $port accesible" -ForegroundColor Green
        }
    } catch {
        # Puerto no accesible, continuar
    }
}

Write-Host "`nSOLUCIONES:" -ForegroundColor Magenta
Write-Host "1. Conectar por RDP a la VM y habilitar SSH"
Write-Host "2. Instalar OpenSSH Server en la VM"
Write-Host "3. Verificar firewall en la VM"


