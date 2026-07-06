@echo off
echo ===================================================
echo Launching CA Practice Manager...
echo ===================================================

:: Check if node_modules folder exists, if not run npm install
if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
)

:: Start Vite dev server in a new window with local network visibility
start cmd /c "npm run dev -- --host"

:: Wait for Vite to bind to port 5173
echo Waiting for server to initialize...
timeout /t 3 /nobreak > nul

:: Open default browser to the localhost address
start "" "http://localhost:5173/"

echo Server started successfully. Close the command window to stop.
