<#
PowerShell helper to apply Prisma migrations on a target host safely.
- Loads .env if present (optional)
- Optionally runs a SQL fix file (useful when a column is missing)
- Runs prisma migrate deploy, prisma generate, npm ci, npm run build
- Supports prompting for SQL Server password if -RunFix is used

Usage:
  .\scripts\remote-apply-migrations.ps1 [-RunFix] [-FixSqlPath ".\prisma\migrations\20251028_make_email_unique\fix_add_email_and_constraint.sql"]
#>
param(
  [switch]$RunFix,
  [string]$FixSqlPath = ".\prisma\migrations\20251028_make_email_unique\fix_add_email_and_constraint.sql",
  [switch]$SkipBuild
)

function Import-DotEnvFile {
  param([string]$Path = '.env')
  if (Test-Path $Path) {
    foreach ($line in Get-Content $Path) {
      if (-not $line) { continue }
      if ($line.Trim().StartsWith('#')) { continue }
      $parts = $line -split '=', 2
      if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $val = $parts[1].Trim().Trim('"')
        # use dictionary-style env assignment
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
      }
    }
    Write-Host "Loaded .env into environment"
  }
}

Import-DotEnvFile

if ($RunFix.IsPresent) {
  if (-not (Test-Path $FixSqlPath)) { Write-Error "Fix SQL not found at $FixSqlPath"; exit 1 }

  # Ensure sqlcmd exists
  if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) { Write-Error "sqlcmd not found in PATH."; exit 1 }

  # collect connection info from env or prompt
  $server = "$env:SQL_SERVER_HOST,$env:SQL_SERVER_PORT"
  if (-not $env:SQL_SERVER_DATABASE) { $env:SQL_SERVER_DATABASE = Read-Host "SQL database name (e.g. gestion_activos_imgc)" }
  if (-not $env:SQL_SERVER_USER) { $env:SQL_SERVER_USER = Read-Host "SQL username" }
  if (-not $env:SQL_SERVER_PASSWORD) {
    $secure = Read-Host "SQL password (will not be echoed)" -AsSecureString
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $env:SQL_SERVER_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  }

  Write-Host "Running fix SQL: $FixSqlPath on $server/$($env:SQL_SERVER_DATABASE)"
  sqlcmd -S $server -U $env:SQL_SERVER_USER -P $env:SQL_SERVER_PASSWORD -d $env:SQL_SERVER_DATABASE -i $FixSqlPath -b
  if ($LASTEXITCODE -ne 0) { Write-Error "sqlcmd failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }
  Write-Host "Fix SQL executed successfully." -ForegroundColor Green
}

# Now run prisma deploy/generate and optionally build
Write-Host "Running prisma migrate deploy..."
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Error "prisma migrate deploy failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

Write-Host "Generating prisma client..."
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error "prisma generate failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

if (-not $SkipBuild.IsPresent) {
  Write-Host "Installing & building app (npm ci && npm run build)..."
  npm ci
  if ($LASTEXITCODE -ne 0) { Write-Error "npm ci failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }
  npm run build
  if ($LASTEXITCODE -ne 0) { Write-Error "npm run build failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }
}

Write-Host "Migrations & build completed. Restart your app process manager (pm2/systemd/service)." -ForegroundColor Green
