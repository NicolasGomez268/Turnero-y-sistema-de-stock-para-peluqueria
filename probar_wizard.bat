@echo off
echo ============================================
echo   TINCHO Barberia - PRUEBA COMPLETA FASE 4
echo ============================================
echo.
echo Este script iniciara el servidor completo
echo y abrira el navegador automaticamente.
echo.
echo ========================================
echo PASO 1: Activando entorno virtual...
echo ========================================
call venv\Scripts\activate

echo.
echo ========================================
echo PASO 2: Iniciando Backend Django...
echo ========================================
start "TINCHO Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && python manage.py runserver"

echo.
echo Esperando que el backend inicie...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo PASO 3: Iniciando Frontend React...
echo ========================================
start "TINCHO Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Esperando que el frontend compile...
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo PASO 4: Abriendo navegador...
echo ========================================
start http://localhost:5173

echo.
echo ========================================
echo   ✅ SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Servidores activos:
echo   - Backend:  http://localhost:8000
echo   - Frontend: http://localhost:5173
echo.
echo Para probar el wizard:
echo   1. Selecciona una fecha
echo   2. Elige un barbero
echo   3. Selecciona un horario
echo   4. Completa tus datos
echo   5. Confirma la reserva
echo.
echo Presiona cualquier tecla para salir...
pause >nul
