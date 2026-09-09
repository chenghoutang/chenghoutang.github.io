@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo    Duck Quotes Manager - 鸭语录管理工具
echo ============================================
echo.
echo 正在启动管理服务...
echo 浏览器访问: http://localhost:3210
echo 按 Ctrl+C 退出
echo.

start http://localhost:3210
node manage-quotes.js

pause
