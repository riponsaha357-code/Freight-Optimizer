@echo off
echo ============================================================
echo   NAVI-STEEL FREIGHT AI  -  HTTPS ENTERPRISE LAUNCHER
echo ============================================================

echo [1/2] Starting Backend (FastAPI HTTPS) on https://127.0.0.1:8000 ...
start "Navi-Steel Backend" cmd /k "cd /d "%~dp0backend" && (if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) else if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat)) && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 --ssl-certfile certs/cert.pem --ssl-keyfile certs/key.pem"

echo [2/2] Starting Frontend (Vite HTTPS) on https://localhost:5173 ...
start "Navi-Steel Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting 5 seconds for services to start...
timeout /t 5 /nobreak >nul

echo Opening browser...
start https://localhost:5173

echo ============================================================
echo   DONE! Both services are running on HTTPS.
echo ============================================================
echo   Frontend  : https://localhost:5173
echo   API Docs  : https://127.0.0.1:8000/docs
echo ============================================================