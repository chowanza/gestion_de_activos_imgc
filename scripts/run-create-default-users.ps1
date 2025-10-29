<#
PowerShell wrapper to create default users (admin, editor, viewer).
Usage:
  - Interactive (prompts for passwords if not set):
      .\scripts\run-create-default-users.ps1
  - Non-interactive (pass as args):
      .\scripts\run-create-default-users.ps1 -AdminPass "P@ss1" -EditorPass "P@ss2" -ViewerPass "P@ss3"

This script sets environment variables used by scripts/create-default-users.ts and runs it with npx tsx.
#>
param(
  [string]$AdminPass,
  [string]$EditorPass,
  [string]$ViewerPass,
  [switch]$DryRun
)

function Read-Password([string]$prompt) {
  Write-Host $prompt -NoNewline
  $secure = Read-Host "" -AsSecureString
  $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

if (-not $AdminPass) {
  if ($env:ADMIN_PASSWORD) { $AdminPass = $env:ADMIN_PASSWORD }
  else { $AdminPass = Read-Password "Admin password (will not be echoed): " }
}
if (-not $EditorPass) {
  if ($env:EDITOR_PASSWORD) { $EditorPass = $env:EDITOR_PASSWORD }
  else { $EditorPass = Read-Password "Editor password (will not be echoed): " }
}
if (-not $ViewerPass) {
  if ($env:VIEWER_PASSWORD) { $ViewerPass = $env:VIEWER_PASSWORD }
  else { $ViewerPass = Read-Password "Viewer password (will not be echoed): " }
}

# Export to process environment for the child process
$env:ADMIN_PASSWORD = $AdminPass
$env:EDITOR_PASSWORD = $EditorPass
$env:VIEWER_PASSWORD = $ViewerPass

$scriptPath = "scripts/create-default-users.ts"
if ($DryRun.IsPresent) { $dryArg = '--dry' } else { $dryArg = '' }

Write-Host "Running seed script: $scriptPath (dry run=$($DryRun.IsPresent))"

# Run via npx tsx
& npx tsx $scriptPath $dryArg
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) { Write-Error "Seed script exited with code $exitCode"; exit $exitCode }
Write-Host "Seed script completed successfully." -ForegroundColor Green
