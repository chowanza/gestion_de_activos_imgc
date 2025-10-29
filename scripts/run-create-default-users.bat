@echo off
REM Wrapper to run scripts/create-default-users.ts on Windows CMD
REM Usage:
REM   - Provide passwords as args: run-create-default-users.bat AdminPass EditorPass ViewerPass [--dry]
REM   - Or set environment variables ADMIN_PASSWORD, EDITOR_PASSWORD, VIEWER_PASSWORD beforehand.

SETLOCAL

nREM Read args
SET "ADMIN_ARG=%~1"
SET "EDITOR_ARG=%~2"
SET "VIEWER_ARG=%~3"
SET "FOURTH=%~4"

nREM Determine dry run flag
SET "DRY_FLAG="
IF /I "%FOURTH%"=="--dry" (
  SET "DRY_FLAG=--dry"
)

REM Use args or env vars
IF NOT "%ADMIN_ARG%"=="" (
  SET "ADMIN_PASSWORD=%ADMIN_ARG%"
) ELSE IF DEFINED ADMIN_PASSWORD (
  REM keep existing
) ELSE (
  ECHO ADMIN password not provided. Please set ADMIN_PASSWORD env var or pass as first argument.
  EXIT /B 1
)

IF NOT "%EDITOR_ARG%"=="" (
  SET "EDITOR_PASSWORD=%EDITOR_ARG%"
) ELSE IF DEFINED EDITOR_PASSWORD (
  REM keep existing
) ELSE (
  ECHO EDITOR password not provided. Please set EDITOR_PASSWORD env var or pass as second argument.
  EXIT /B 1
)

IF NOT "%VIEWER_ARG%"=="" (
  SET "VIEWER_PASSWORD=%VIEWER_ARG%"
) ELSE IF DEFINED VIEWER_PASSWORD (
  REM keep existing
) ELSE (
  ECHO VIEWER password not provided. Please set VIEWER_PASSWORD env var or pass as third argument.
  EXIT /B 1
)

ECHO Running create-default-users with provided credentials (dry=%DRY_FLAG%)...
npx tsx scripts/create-default-users.ts %DRY_FLAG%
IF ERRORLEVEL 1 (
  ECHO Script failed with exit code %ERRORLEVEL%.
  EXIT /B %ERRORLEVEL%
)
ECHO Done.
ENDLOCAL
