@echo off
rem Kills any node process listening on port 3000 (the CRM server)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Stopping CRM server ^(PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
timeout /t 2 >nul
