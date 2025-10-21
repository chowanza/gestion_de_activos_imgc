<#
.SYNOPSIS
  Helper to create a self-signed cert, export to PFX, convert to PEM and place files for Nginx on Windows.

.PARAMETER Host
  Hostname or IP that the certificate will secure (e.g. 172.16.3.123 or app.local)

.PARAMETER NginxConfDir
  Root folder of nginx conf (default C:\nginx\conf)

.PARAMETER PfxPassword
  Password used to protect the temporary PFX file

.EXAMPLE
  pwsh .\scripts\setup-windows-nginx-https.ps1 -Host '172.16.3.123' -NginxConfDir 'C:\nginx\conf' -PfxPassword 'ChangeMe123!'
#>

param(
  [Parameter(Mandatory=$true)][string]$Host,
  [string]$NginxConfDir = 'C:\nginx\conf',
  [string]$PfxPassword = 'ChangeMe123!'
)

function Ensure-OpenSSL {
  try {
    $openssl = Get-Command openssl -ErrorAction SilentlyContinue
    if ($null -eq $openssl) {
      Write-Host "OpenSSL no encontrado. Instalando openssl.light via choco..." -ForegroundColor Yellow
      choco install -y openssl.light
    } else {
      Write-Host "OpenSSL encontrado: $($openssl.Path)" -ForegroundColor Green
    }
  } catch {
    Write-Error "Error al comprobar/instalar OpenSSL: $_"
    throw
  }
}

function New-SelfSignedToPfx {
  param($Host, $PfxPath, $PfxPassword)
  Write-Host "Creando certificado self-signed para $Host..."
  $cert = New-SelfSignedCertificate -DnsName $Host -CertStoreLocation Cert:\LocalMachine\My -NotAfter (Get-Date).AddYears(5) -FriendlyName "imgc-$Host"
  Write-Host "Exportando PFX a $PfxPath"
  Export-PfxCertificate -Cert $cert -FilePath $PfxPath -Password (ConvertTo-SecureString $PfxPassword -AsPlainText -Force)
  return $PfxPath
}

function Convert-PfxToPem {
  param($PfxPath, $PfxPassword, $OutCrt, $OutKey)
  Write-Host "Convirtiendo PFX a PEM (crt + key)"
  $openssl = Get-Command openssl
  & $openssl.Path pkcs12 -in $PfxPath -clcerts -nokeys -out $OutCrt -passin pass:$PfxPassword
  & $openssl.Path pkcs12 -in $PfxPath -nocerts -nodes -out $OutKey -passin pass:$PfxPassword
}

function Ensure-NginxCertDir {
  param($NginxConfDir)
  $certDir = Join-Path $NginxConfDir 'certs'
  if (!(Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir -Force | Out-Null }
  return $certDir
}

try {
  Write-Host "Preparando certs para host: $Host"
  Ensure-OpenSSL

  $tempDir = Join-Path $env:TEMP "imgc-certs-$([guid]::NewGuid().ToString())"
  New-Item -ItemType Directory -Path $tempDir | Out-Null

  $pfxPath = Join-Path $tempDir "imgc-$Host.pfx"
  New-SelfSignedToPfx -Host $Host -PfxPath $pfxPath -PfxPassword $PfxPassword

  $crtPath = Join-Path $tempDir "imgc-$Host.crt"
  $keyPath = Join-Path $tempDir "imgc-$Host.key"
  Convert-PfxToPem -PfxPath $pfxPath -PfxPassword $PfxPassword -OutCrt $crtPath -OutKey $keyPath

  $certDir = Ensure-NginxCertDir -NginxConfDir $NginxConfDir
  $destCrt = Join-Path $certDir "imgc-$Host.crt"
  $destKey = Join-Path $certDir "imgc-$Host.key"

  Copy-Item -Path $crtPath -Destination $destCrt -Force
  Copy-Item -Path $keyPath -Destination $destKey -Force

  Write-Host "Certs copiadas a: $certDir"
  Write-Host "CRT: $destCrt" -ForegroundColor Green
  Write-Host "KEY: $destKey" -ForegroundColor Green

  Write-Host "\n--- Bloque Nginx sugerido (pégalo en nginx.conf o sites-available) ---\n"
  $nginxBlock = @"
server {
    listen 443 ssl;
    server_name $Host;

    ssl_certificate      conf/certs/imgc-$Host.crt;
    ssl_certificate_key  conf/certs/imgc-$Host.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name $Host;
    return 301 https://$host$request_uri;
}
"@

  Write-Host $nginxBlock
  Write-Host "\nHecho. Reinicia Nginx para aplicar la configuración (ej: Restart-Service nginx) y actualiza .env con NEXT_PUBLIC_APP_URL=https://$Host y elimina COOKIE_FORCE_SECURE."

  } catch {
  Write-Error "Error durante el proceso: $_"
  exit 1
}
