@echo off
title Push CA Practice Manager to GitHub
echo ========================================================
echo       SAVING CA PRACTICE MANAGER TO GITHUB
echo ========================================================
echo.
echo Target Repository: https://github.com/raramavarma1956/ca-firm-manager.git
echo.

:: Authenticate with GitHub CLI if not logged in
"C:\Program Files\GitHub CLI\gh.exe" auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo [Step 1] Logging into GitHub...
    echo A browser window will open for one-click authorization.
    "C:\Program Files\GitHub CLI\gh.exe" auth login --web -h github.com -p https
    "C:\Program Files\GitHub CLI\gh.exe" auth setup-git
)

echo.
echo [Step 2] Pushing all code and commit history to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! All code and details are now saved to GitHub:
    echo  https://github.com/raramavarma1956/ca-firm-manager
    echo ========================================================
) else (
    echo.
    echo Retrying with default Git credential manager...
    git push -u origin main
)

echo.
pause
