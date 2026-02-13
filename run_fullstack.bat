@echo off
echo ========================================
echo    TINCHO Barberia - Servidor Full Stack
echo ========================================
echo.
echo Iniciando Backend (Django) y Frontend (React)...
echo.

REM Iniciar Django en una ventana separada
start "TINCHO Backend (Django)" cmd /k "cd /d %~dp0 && venv\Scripts\activate && python manage.py runserver"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Iniciar Vite en otra ventana
start "TINCHO Frontend (React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Servidores iniciados:
echo    - Backend:  http://localhost:8000
echo    - Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para salir...
pause >nul
