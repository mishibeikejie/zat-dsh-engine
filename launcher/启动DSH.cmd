@echo off
cd /d "%~dp0"
where pwsh >nul 2>nul
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0DSH启动器.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DSH启动器.ps1"
)
