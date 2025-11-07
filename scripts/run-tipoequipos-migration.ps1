<#
.IMGC TipoEquipo Normalization Orchestrator (PowerShell)

Usage:
  .\scripts\run-tipoequipos-migration.ps1 [-NoBuild] [-Force] [-SkipMigrate]

Switches:
  -NoBuild      Skip npm run build at the end
  -Force        Pass --force to backfill script (override abort if types missing)
  -SkipMigrate  Skip prisma migrate deploy
#>
param(
  [switch]$NoBuild,
  [switch]$Force,
  [switch]$SkipMigrate
)

$ErrorActionPreference = 'Stop'

Write-Host '=== IMGC TipoEquipo Normalization (PowerShell) ==='

# Ensure we run at repo root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Join-Path $scriptDir '..'
Set-Location $repoRoot

# 1) Pre-flight checks
if (-not (Test-Path 'package.json')) {
  Write-Error '[ERROR] package.json not found. Run from project root.'
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error '[ERROR] Node.js not found in PATH. Install Node before continuing.'
}

# 2) Install deps if needed
if (-not (Test-Path 'node_modules')) {
  Write-Host '[INFO] node_modules missing -> running npm install...'
  npm install | Write-Output
}
else {
  Write-Host '[OK] Dependencies present.'
}

# 3) Prisma migrate deploy (unless skipped)
if (-not $SkipMigrate) {
  Write-Host '[STEP] Applying pending Prisma migrations (deploy)...'
  npx prisma migrate deploy | Write-Output
}
else {
  Write-Host '[SKIP] prisma migrate deploy skipped by flag.'
}

# 4) Prisma generate
Write-Host '[STEP] Ensuring Prisma client is generated...'
npx prisma generate | Write-Output

# 5) Sync tipos (idempotent)
if (-not (Test-Path 'scripts/sync-tipos-equipos.ts')) {
  Write-Error '[ERROR] scripts/sync-tipos-equipos.ts not found.'
}
Write-Host '[STEP] Syncing base TipoEquipo records...'
npx tsx scripts/sync-tipos-equipos.ts | Write-Output

# 6) Backfill dry-run then apply
if (-not (Test-Path 'scripts/backfill-modelos-tipoequipo.ts')) {
  Write-Error '[ERROR] scripts/backfill-modelos-tipoequipo.ts not found.'
}

$forceArg = if ($Force) { '--force' } else { '' }

Write-Host '[STEP] Backfill dry-run (preview)...'
npx tsx scripts/backfill-modelos-tipoequipo.ts $forceArg | Write-Output

Write-Host '[STEP] Applying backfill (--apply)...'
npx tsx scripts/backfill-modelos-tipoequipo.ts --apply $forceArg | Write-Output

# 7) Remove legacy dynamic route folder if exists
$legacyRoute = 'src/app/api/tipos-equipos/[tipo]'
if (Test-Path $legacyRoute) {
  Write-Host "[CLEANUP] Removing legacy dynamic route folder: $legacyRoute"
  Remove-Item -LiteralPath $legacyRoute -Recurse -Force -ErrorAction SilentlyContinue
}
else {
  Write-Host '[OK] Legacy [tipo] route folder not found (already clean)'
}

# 8) Purge .next build cache
if (Test-Path '.next') {
  Write-Host '[CLEANUP] Removing .next cache directory...'
  Remove-Item '.next' -Recurse -Force -ErrorAction SilentlyContinue
}
else {
  Write-Host '[OK] .next directory not present.'
}

# 9) Build (optional)
if (-not $NoBuild) {
  Write-Host '[STEP] Running production build...'
  npm run build | Write-Output
  Write-Host '[SUCCESS] Build completed successfully.'
}
else {
  Write-Host '[SKIP] Build skipped by flag.'
}

Write-Host '=== COMPLETED: TipoEquipo normalization sequence finished ==='
