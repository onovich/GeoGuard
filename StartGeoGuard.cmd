@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0StartGeoGuard.ps1" %*
endlocal
