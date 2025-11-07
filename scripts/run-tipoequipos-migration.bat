@echo off
REM ============================================================================
REM  IMGC - TipoEquipo Normalization Orchestrator (Batch)
REM  Usage: run-tipoequipos-migration.bat [--no-build] [--force] [--skip-migrate]
REM         --no-build       Skip npm run build at the end
REM         --force          Pass --force to backfill script (override abort if types missing)
REM         --skip-migrate   Skip prisma migrate deploy (assume already applied)
REM ============================================================================

SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

SET ROOT=%~dp0..
PUSHD "%ROOT%"

ECHO === IMGC TipoEquipo Normalization (Batch) ===

REM --------------------------------------------------------------------
REM 1. Basic pre-flight checks
REM --------------------------------------------------------------------
IF NOT EXIST package.json (
  ECHO [ERROR] package.json not found. Run from project root.
  EXIT /B 1
)

WHERE node >NUL 2>&1 || (
  ECHO [ERROR] Node.js not found in PATH. Install Node before continuing.
  EXIT /B 1
)

REM --------------------------------------------------------------------
REM Parse flags
REM --------------------------------------------------------------------
SET DO_BUILD=1
SET FORCE_FLAG=
SET DO_MIGRATE=1

:parseArgs
IF "%~1"=="" GOTO argsDone
IF /I "%~1"=="--no-build" SET DO_BUILD=0
IF /I "%~1"=="--force" SET FORCE_FLAG=--force
IF /I "%~1"=="--skip-migrate" SET DO_MIGRATE=0
SHIFT
GOTO parseArgs
:argsDone

REM --------------------------------------------------------------------
REM 2. Install deps if node_modules missing
REM --------------------------------------------------------------------
IF NOT EXIST node_modules (
  ECHO [INFO] node_modules missing -> running npm install...
  npm install || EXIT /B 1
) ELSE (
  ECHO [OK] Dependencies present.
)

REM --------------------------------------------------------------------
REM 3. Prisma migrate deploy (production-safe) unless skipped
REM --------------------------------------------------------------------
IF "%DO_MIGRATE%"=="1" (
  ECHO [STEP] Applying pending Prisma migrations (deploy)...
  npx prisma migrate deploy || EXIT /B 1
) ELSE (
  ECHO [SKIP] prisma migrate deploy skipped by flag.
)

REM --------------------------------------------------------------------
REM 4. Generate Prisma client (safe if already generated)
REM --------------------------------------------------------------------
ECHO [STEP] Ensuring Prisma client is generated...
npx prisma generate || EXIT /B 1

REM --------------------------------------------------------------------
REM 5. Run sync tipos script (idempotent)
REM --------------------------------------------------------------------
ECHO [STEP] Syncing base TipoEquipo records...
IF NOT EXIST scripts\sync-tipos-equipos.ts (
  ECHO [ERROR] scripts\sync-tipos-equipos.ts not found.
  EXIT /B 1
)

npx tsx scripts/sync-tipos-equipos.ts || EXIT /B 1

REM --------------------------------------------------------------------
REM 6. Backfill tipoEquipoId (dry-run first)
REM --------------------------------------------------------------------
ECHO [STEP] Backfill dry-run (preview)...
IF NOT EXIST scripts\backfill-modelos-tipoequipo.ts (
  ECHO [ERROR] scripts\backfill-modelos-tipoequipo.ts not found.
  EXIT /B 1
)

npx tsx scripts/backfill-modelos-tipoequipo.ts %FORCE_FLAG% || EXIT /B 1

ECHO [STEP] Applying backfill (--apply)...
npx tsx scripts/backfill-modelos-tipoequipo.ts --apply %FORCE_FLAG% || EXIT /B 1

REM --------------------------------------------------------------------
REM 7. Remove legacy dynamic route folder if still present
REM --------------------------------------------------------------------
SET LEGACY_ROUTE=src\app\api\tipos-equipos\[tipo]
IF EXIST "%LEGACY_ROUTE%" (
  ECHO [CLEANUP] Removing legacy dynamic route folder: %LEGACY_ROUTE%
  rmdir /S /Q "%LEGACY_ROUTE%" || ECHO [WARN] Failed to remove folder (manual deletion may be required)
) ELSE (
  ECHO [OK] Legacy [tipo] route folder not found (already clean)
)

REM --------------------------------------------------------------------
REM 8. Purge .next build cache
REM --------------------------------------------------------------------
IF EXIST .next (
  ECHO [CLEANUP] Removing .next cache directory...
  rmdir /S /Q .next || ECHO [WARN] Could not fully remove .next
) ELSE (
  ECHO [OK] .next directory not present.
)

REM --------------------------------------------------------------------
REM 9. Build (optional)
REM --------------------------------------------------------------------
IF "%DO_BUILD%"=="1" (
  ECHO [STEP] Running production build...
  npm run build || EXIT /B 1
  ECHO [SUCCESS] Build completed successfully.
) ELSE (
  ECHO [SKIP] Build skipped by flag.
)

ECHO === COMPLETED: TipoEquipo normalization sequence finished ===

POPD
ENDLOCAL
EXIT /B 0
