@echo off
title Estate CRM - close this window to stop the server
cd /d "%~dp0"

rem Open browser after a short delay so the server has time to start
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

rem Start the production server (runs until this window is closed)
call npm start
