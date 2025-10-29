<#
PowerShell helper to create a Prisma migration on a dev machine safely.
- Creates a migration (create-only) using Prisma
- Shows git status and suggests commit/push commands
- Optional: auto-commit and push

Usage:
  .\scripts\dev-create-migration.ps1 -Name "make-email-unique" [-AutoPush]
#>
param(
  [Parameter(Mandatory=$true)]
  [string]$Name,
  [switch]$AutoPush
)

Write-Host "Creating Prisma migration (create-only) with name: $Name"

# Ensure node and prisma are available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Error "npx not found in PATH. Install Node.js / ensure npx is available."; exit 1
}

# Create migration (create-only) to avoid applying it to local DB automatically
Write-Host "Running: npx prisma migrate dev --create-only --name $Name"
& npx prisma migrate dev --create-only --name $Name
$code = $LASTEXITCODE
if ($code -ne 0) { Write-Error "Failed to create migration (exit $code)"; exit $code }

# Show git status for migration files
Write-Host "Migration created. Showing git status for prisma/migrations:"
& git status --porcelain prisma/migrations | ForEach-Object { Write-Host $_ }

Write-Host "You should review the generated SQL in prisma/migrations/<timestamp>_$Name and then commit & push the files."
Write-Host "Suggested commands to run after review:"
Write-Host "  git add prisma/migrations -A"
Write-Host "  git commit -m \"prisma: add migration $Name\""
Write-Host "  git push origin $(git rev-parse --abbrev-ref HEAD)"

if ($AutoPush.IsPresent) {
  Write-Host "AutoPush requested: adding, committing and pushing migration files"
  git add prisma/migrations -A
  git commit -m "prisma: add migration $Name"
  if ($LASTEXITCODE -ne 0) { Write-Error "git commit failed"; exit $LASTEXITCODE }
  git push origin $(git rev-parse --abbrev-ref HEAD)
  if ($LASTEXITCODE -ne 0) { Write-Error "git push failed"; exit $LASTEXITCODE }
  Write-Host "Migration files pushed." -ForegroundColor Green
}
