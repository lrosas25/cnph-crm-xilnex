@echo off
setlocal

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with administrator privileges
    echo.
) else (
    echo ❌ This script requires administrator privileges
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo ===============================================
echo          CRM Backend Service Manager
echo ===============================================
echo.
echo Available commands:
echo   1. Install service
echo   2. Start service
echo   3. Stop service
echo   4. Restart service
echo   5. Uninstall service
echo   6. Check service status
echo   7. View service logs
echo   0. Exit
echo.

:menu
set /p choice="Enter your choice (0-7): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto uninstall
if "%choice%"=="6" goto status
if "%choice%"=="7" goto logs
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
echo.
goto menu

:install
echo.
echo 🔧 Installing CRM Backend Service...
npm run service:install
echo.
pause
goto menu

:start
echo.
echo 🚀 Starting CRM Backend Service...
npm run service:start
echo.
pause
goto menu

:stop
echo.
echo 🛑 Stopping CRM Backend Service...
npm run service:stop
echo.
pause
goto menu

:restart
echo.
echo 🔄 Restarting CRM Backend Service...
npm run service:restart
echo.
pause
goto menu

:uninstall
echo.
echo ⚠️  Are you sure you want to uninstall the service? (Y/N)
set /p confirm=
if /i "%confirm%" == "Y" (
    echo 🗑️  Uninstalling CRM Backend Service...
    npm run service:uninstall
) else (
    echo Operation cancelled.
)
echo.
pause
goto menu

:status
echo.
echo 📊 Checking service status...
npm run service:status
echo.
echo To view in Windows Services Manager, run: services.msc
echo.
pause
goto menu

:logs
echo.
echo 📝 Opening Event Viewer for service logs...
echo Look for "CRM Backend Service" in Application logs
eventvwr.msc
echo.
pause
goto menu

:exit
echo.
echo 👋 Goodbye!
exit /b 0