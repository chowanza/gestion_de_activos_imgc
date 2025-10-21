<#
.SYNOPSIS
  Automated deploy script for Windows VM (install prerequisites, clone repo, build, PM2 service, nginx + self-signed cert).

.DESCRIPTION
  Run this script in an Administrator PowerShell. It performs many destructive actions (installs packages, writes .env, restarts services).
  Review the script before running. It prompts for secrets if not provided.

.PARAMETER RepoUrl
  Git repository URL (default uses origin in current folder if exists).

.PARAMETER AppPath
  Local path where the repo will be cloned (default C:\inetpub\wwwroot\gestion_de_activos_imgc)

.PARAMETER Host
  Hostname or IP for the certificate and nginx server_name (e.g. 172.16.3.123)

.PARAMETER NginxConfDir
  Nginx conf folder (default C:\nginx\conf)

.PARAMETER DatabaseUrl
  Full DATABASE_URL for Prisma/production

.EXAMPLE
  pwsh .\scripts\auto-deploy-windows.ps1 -RepoUrl 'https://github.com/chowanza/gestion_de_activos_imgc.git' -Host '172.16.3.123' -DatabaseUrl 'sqlserver://user:pass@host:1433;database=ventory;encrypt=true;trustServerCertificate=true'
#>

param(
  [string]$RepoUrl = 'https://github.com/chowanza/gestion_de_activos_imgc.git',
  [string]$AppPath = 'C:\inetpub\wwwroot\gestion_de_activos_imgc',
  [Parameter(Mandatory=$true)][string]$AppHost,
  [string]$NginxConfDir = 'C:\nginx\conf',
  [string]$DatabaseUrl
)

function Require-Admin {
  if (-NOT ([bool] (New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))) {
    Write-Error "Este script requiere que PowerShell se ejecute como Administrador. Aborta."; exit 1
  }
}

function Prompt-SecretIfEmpty([string]$value, [string]$prompt) {
  if ([string]::IsNullOrEmpty($value)) {
    return Read-Host -Prompt $prompt -AsSecureString
  }
  # convert plain string to securestring
  return ConvertTo-SecureString $value -AsPlainText -Force
}

Require-Admin

# Ensure Chocolatey
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
  Write-Host "Instalando Chocolatey..." -ForegroundColor Yellow
  Set-ExecutionPolicy Bypass -Scope Process -Force
  iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install base packages
$packages = @('git','nvm','nginx','openssl.light')
foreach ($p in $packages) {
  if (-not (choco list --localonly | Select-String "^$p")) {
    Write-Host "Instalando $p..."
    choco install -y $p
  } else { Write-Host "$p ya instalado" }
}

# Load nvm path (nvm-windows requires new shell; attempt to source)
$env:NVM_HOME = "$env:ProgramFiles\nodejs\nvm"; if (-not (Test-Path $env:NVM_HOME)) { $env:NVM_HOME = "$env:ProgramFiles\nvm" }
$env:Path = "$env:NVM_HOME;$env:Path"

# Install node LTS via nvm
try {
  nvm install lts | Out-Null
  nvm use lts | Out-Null
} catch {
  Write-Warning "nvm install/use falló; intenta reiniciar la consola y volver a ejecutar si hay problema. Continuando..."
}

# Install pm2
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) { npm install -g pm2; npm install -g pm2-windows-service }

# Clone or pull repo
if (Test-Path $AppPath) {
  Write-Host "Directorio $AppPath existe, actualizar repo..."
  Push-Location $AppPath
  git fetch --all
  git checkout main
  git pull origin main
  Pop-Location
} else {
  Write-Host "Clonando repo en $AppPath"
  git clone $RepoUrl $AppPath
}

# Build app
Push-Location $AppPath

# Prompt for DB URL if not provided
if (-not $DatabaseUrl) {
  $plainDb = Read-Host -Prompt 'DATABASE_URL (ej: sqlserver://user:pass@host:1433;database=ventory;... )'
  $DatabaseUrl = $plainDb
}

# Prompt secrets
$jwtSecret = Read-Host -Prompt 'JWT_SECRET_KEY (texto plano)'
$nextAuthSecret = Read-Host -Prompt 'NEXTAUTH_SECRET (texto plano)'

# Write .env (backup existing)
$envPath = Join-Path $AppPath '.env'
if (Test-Path $envPath) { Copy-Item $envPath "$envPath.bak_$(Get-Date -Format yyyyMMddHHmmss)" -Force }

$envContent = @"
DATABASE_URL="$DatabaseUrl"
JWT_SECRET_KEY="$jwtSecret"
NEXT_PUBLIC_URL="http://$AppHost:3000"
NEXTAUTH_URL="http://$AppHost:3000"
NEXTAUTH_SECRET="$nextAuthSecret"
COOKIE_DEBUG=false
# TEMPORAL: durante la migración a HTTPS
COOKIE_FORCE_SECURE=false
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="http://$AppHost:3000"
"@

$envContent | Out-File -FilePath $envPath -Encoding UTF8 -Force
Write-Host ".env escrito en $envPath"

Write-Host "Instalando dependencias (npm ci)" -ForegroundColor Cyan
npm ci

Write-Host "Generando Prisma client si aplica" -ForegroundColor Cyan
try { npx prisma generate } catch { Write-Warning "Prisma generate falló o no está configurado" }

Write-Host "Construyendo Next.js (npm run build)" -ForegroundColor Cyan
npm run build

# Start app with pm2
Write-Host "Iniciando app con pm2..."
Start-Sleep -Seconds 2
pm2 start npm --name imgc -- start
pm2 save

# Install pm2 windows service to run on boot
Write-Host "Instalando pm2 como servicio Windows (pm2-service-install)" -ForegroundColor Cyan
try {
  try {
    pm2-service-install -n PM2 -s
  } catch {
    pm2-service-install -n PM2
  }
} catch { Write-Warning "pm2-service-install falló o requiere intervención. Revisa la instalación manualmente." }

# Generate certs and nginx config using helper
Write-Host "Ejecutando helper de Nginx/HTTPS..."
$scriptPath = Join-Path $AppPath 'scripts\setup-windows-nginx-https.ps1'
if (-not (Test-Path $scriptPath)) { Write-Error "No se encontró $scriptPath"; exit 1 }
& pwsh $scriptPath -Host $AppHost -NginxConfDir $NginxConfDir -PfxPassword (Read-Host -Prompt 'PFX password for temporary PFX' -AsSecureString | ConvertFrom-SecureString)

# Append nginx config suggestion to nginx.conf (creates backup first)
$nginxConf = Join-Path $NginxConfDir 'nginx.conf'
if (Test-Path $nginxConf) { Copy-Item $nginxConf "$nginxConf.bak_$(Get-Date -Format yyyyMMddHHmmss)" -Force }

# (NOT automatically editing nginx.conf to avoid corrupting user's config)
Write-Host "El helper imprimió un bloque Nginx sugerido. Abre nginx.conf ($nginxConf) y pega el bloque manualmente."

# Restart nginx service (if exists)
try {
  if (Get-Service -Name nginx -ErrorAction SilentlyContinue) {
    Restart-Service nginx -Force
  } else {
    Write-Host "Servicio nginx no encontrado. Si instalaste nginx sin servicio quizá debas reiniciarlo manualmente." -ForegroundColor Yellow
  }
} catch { Write-Warning "No se pudo reiniciar nginx automáticamente: $_" }

# Update .env for HTTPS (manual step: comment out COOKIE_FORCE_SECURE, set NEXT_PUBLIC_APP_URL to https)
$envText = Get-Content $envPath -Raw
$replacement = 'NEXT_PUBLIC_APP_URL="' + "https://$AppHost" + '"'
$envText = $envText -replace 'NEXT_PUBLIC_APP_URL="http://[^"]*"', $replacement
$envText = $envText -replace 'COOKIE_FORCE_SECURE=false','# COOKIE_FORCE_SECURE=false (removed after HTTPS)'
$envText | Out-File -FilePath $envPath -Encoding UTF8 -Force
Write-Host ".env actualizado para HTTPS (NEXT_PUBLIC_APP_URL set to https). Por seguridad revisa el archivo y elimina COOKIE_FORCE_SECURE manualmente si todo está ok."

# Restart pm2 app
try {
  pm2 restart imgc
} catch {
  pm2 start npm --name imgc -- start
}

Write-Host "Despliegue automatizado completado. Recomendado: revisar nginx.conf, reiniciar nginx y probar desde cliente HTTPS." -ForegroundColor Green

Pop-Location
