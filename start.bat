@echo off
title CityMind Launcher
cd /d "%~dp0"

echo Starting CityMind...

start "CityMind - FastAPI" cmd /k "title CityMind - FastAPI && python -m uvicorn backend.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

start "CityMind - Node.js" cmd /k "title CityMind - Node.js && cd server && node index.js"

timeout /t 2 /nobreak >nul

start "CityMind - Frontend" cmd /k "title CityMind - Frontend && cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

start http://localhost:5173

echo.
echo All servers started:
echo   FastAPI  -^> http://localhost:8000
echo   Node.js  -^> http://localhost:3001
echo   Frontend -^> http://localhost:5173
echo.
pause
