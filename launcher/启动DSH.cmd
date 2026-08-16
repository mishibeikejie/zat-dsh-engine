@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DSH-Launcher.ps1"
if errorlevel 1 (
  echo.
  echo [DSH Launcher] exited with an error - see above.
  pause
)
