@echo off
setlocal enabledelayedexpansion
title Push to GitHub - CA Practice Manager
cd /d "%~dp0"

echo ========================================================
echo       SAVING CA PRACTICE MANAGER TO GITHUB
echo ========================================================
echo Target Repository:
echo https://github.com/raramavarma1956/ca-firm-manager.git
echo.

echo 1. Checking for unsaved changes...
git add -A
git commit -m "Update CA Practice Manager codebase" >nul 2>&1

echo 2. Pushing to GitHub (origin main)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! All code and details are now saved to GitHub:
    echo  https://github.com/raramavarma1956/ca-firm-manager
    echo ========================================================
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================================
echo If Git Credential Manager did not authenticate, you can
echo paste a GitHub Personal Access Token (PAT) below.
echo.
echo To generate a token (takes 30 seconds):
echo 1. Visit: https://github.com/settings/tokens/new
echo 2. Note: "CA Firm Manager"
echo 3. Check the "repo" checkbox (Full control of repositories)
echo 4. Click "Generate token" at the bottom and copy the token.
echo ========================================================
echo.

set /p GHTOKEN="Paste your GitHub Personal Access Token (or press Enter to cancel): "

if not "%GHTOKEN%"=="" (
    echo.
    echo Pushing with your GitHub token...
    git push https://raramavarma1956:%GHTOKEN%@github.com/raramavarma1956/ca-firm-manager.git main
    if !errorlevel! equ 0 (
        git remote set-url origin https://raramavarma1956:%GHTOKEN%@github.com/raramavarma1956/ca-firm-manager.git
        echo.
        echo ========================================================
        echo  SUCCESS! Repository successfully pushed to GitHub!
        echo  https://github.com/raramavarma1956/ca-firm-manager
        echo ========================================================
    ) else (
        echo Push failed. Please verify that the token has "repo" permissions.
    )
)

echo.
pause
