@echo off
setlocal enabledelayedexpansion
title NAVI-STEEL FREIGHT AI LAUNCHER
echo ============================================================
echo   NAVI-STEEL FREIGHT AI  -  HTTPS ENTERPRISE LAUNCHER
echo ============================================================

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"

rem Locate Python executable (check venv first, then system python)
if exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"
) else if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%BACKEND_DIR%\.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

rem Ensure SSL certificates exist
if not exist "%BACKEND_DIR%\certs\cert.pem" (
    echo Generating SSL certificates for HTTPS...
    pushd "%BACKEND_DIR%"
    "%PYTHON_EXE%" generate_ssl_certs.py
    popd
)

echo [1/2] Starting Backend (FastAPI HTTPS) on https://127.0.0.1:8000 ...
start "Navi-Steel Backend" /D "%BACKEND_DIR%" cmd /k ""%PYTHON_EXE%" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 --ssl-certfile certs/cert.pem --ssl-keyfile certs/key.pem"

echo [2/2] Starting Frontend (Vite HTTPS) on https://localhost:5173 ...
start "Navi-Steel Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo.
echo Waiting 4 seconds for services to start...
timeout /t 4 /nobreak >nul

echo Opening browser...
start https://localhost:5173

echo ============================================================
echo   DONE! Both services are running on HTTPS.
echo ============================================================
echo   Frontend  : https://localhost:5173
echo   API Docs  : https://127.0.0.1:8000/docs
echo ============================================================