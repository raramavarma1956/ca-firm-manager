@echo off
setlocal enabledelayedexpansion
title CA Practice Manager Server

echo ========================================================
echo       CA PRACTICE MANAGER & STAFF REGISTRY
echo ========================================================

:: Check if node_modules folder exists, if not run npm install
if not exist "node_modules\" (
    echo [Setup] Installing required dependencies...
    call npm install
)

:: Get Local IP Address for mobile access
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*Wi-Fi*','*Ethernet*' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress -First 1"') do set LOCAL_IP=%%a

if "%LOCAL_IP%"=="" (
    for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Test-Connection -ComputerName (hostname) -Count 1).IPV4Address.IPAddressToString"') do set LOCAL_IP=%%a
)

echo.
echo ========================================================
echo [SERVER READY] Access CA Practice Manager:
echo.
echo   * Computer Browser:  http://localhost:5173/
if not "%LOCAL_IP%"=="" (
echo   * iPhone / Mobile:   http://%LOCAL_IP%:5173/
)
echo.
echo   [iPhone Tips]
echo   1. Connect your iPhone to the SAME Wi-Fi network as this PC.
echo   2. Open Apple Safari on your iPhone.
if not "%LOCAL_IP%"=="" (
echo   3. Navigate to: http://%LOCAL_IP%:5173/
) else (
echo   3. Navigate to your computer's local IP on port 5173.
)
echo   4. Tap the Share button (square with arrow) at the bottom.
echo   5. Tap 'Add to Home Screen' for the native iPhone app!
echo ========================================================
echo.

:: Start Vite dev server in a new window with local network visibility
start "CA Practice Dev Server" cmd /c "npm run dev -- --host"

:: Wait for Vite to bind to port 5173
echo Waiting for server to initialize...
timeout /t 3 /nobreak > nul

:: Open default browser to the localhost address
start "" "http://localhost:5173/"

echo Server started successfully. Keep this window or the server window open while using the app.
pause
