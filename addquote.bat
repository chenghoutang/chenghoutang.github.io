@echo off
chcp 65001 >nul
setlocal

set "QUOTE=%~1"

if "%QUOTE%"=="" (
    echo ============================================
    echo    Duck Quotes Adder
    echo ============================================
    echo.
    echo Usage: addquote.bat "your quote here"
    echo Example: addquote.bat "today is a good day"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

node addquote.js "%QUOTE%"

echo.
pause
