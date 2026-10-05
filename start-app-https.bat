@echo off
setlocal enabledelayedexpansion
title CA Practice Manager Server (HTTPS Mode)

echo ========================================================
echo   CA PRACTICE MANAGER - SECURE HTTPS MODE (FOR IPHONE)
echo ========================================================

if not exist "node_modules\" (
    echo [Setup] Installing required dependencies...
    call npm install
)

for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*Wi-Fi*','*Ethernet*' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress -First 1"') do set LOCAL_IP=%%a

if "%LOCAL_IP%"=="" (
    for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Test-Connection -ComputerName (hostname) -Count 1).IPV4Address.IPAddressToString"') do set LOCAL_IP=%%a
)

echo.
echo ========================================================
echo [SECURE SERVER READY] Access CA Practice Manager via HTTPS:
echo.
echo   * Computer Browser:  https://localhost:5173/
if not "%LOCAL_IP%"=="" (
echo   * iPhone / Mobile:   https://%LOCAL_IP%:5173/
)
echo.
echo   [iPhone Safari Tip for Local HTTPS]
echo   When Safari shows "This Connection Is Not Private",
echo   tap "Show Details" and then tap "visit this website" to proceed.
echo ========================================================
echo.

start "CA Practice HTTPS Server" cmd /c "npm run dev:https"

timeout /t 3 /nobreak > nul
start "" "https://localhost:5173/"

echo HTTPS Server started successfully. Keep this window open.
pause
