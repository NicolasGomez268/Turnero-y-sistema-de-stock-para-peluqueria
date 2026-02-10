@echo off
chcp 65001 > nul
echo ════════════════════════════════════════════════════════════
echo   TINCHO Barbería - Script de Instalación y Ejecución
echo ════════════════════════════════════════════════════════════
echo.

:MENU
echo.
echo Selecciona una opción:
echo.
echo [1] Instalación completa (primera vez)
echo [2] Iniciar servidor de desarrollo
echo [3] Crear superusuario
echo [4] Cargar datos de prueba
echo [5] Realizar migraciones
echo [6] Ejecutar tests
echo [7] Salir
echo.
set /p opcion="Ingresa el número de opción: "

if "%opcion%"=="1" goto INSTALAR
if "%opcion%"=="2" goto RUNSERVER
if "%opcion%"=="3" goto SUPERUSER
if "%opcion%"=="4" goto LOADDATA
if "%opcion%"=="5" goto MIGRATE
if "%opcion%"=="6" goto TESTS
if "%opcion%"=="7" goto SALIR

echo Opción no válida
goto MENU

:INSTALAR
echo.
echo ══════════════════════════════════════
echo   INSTALACIÓN COMPLETA
echo ══════════════════════════════════════
echo.
echo [1/5] Creando entorno virtual...
python -m venv venv
echo ✓ Entorno virtual creado
echo.

echo [2/5] Activando entorno virtual...
call venv\Scripts\activate.bat
echo ✓ Entorno virtual activado
echo.

echo [3/5] Instalando dependencias...
pip install -r requirements.txt
echo ✓ Dependencias instaladas
echo.

echo [4/5] Creando migraciones...
python manage.py makemigrations
python manage.py migrate
echo ✓ Migraciones aplicadas
echo.

echo [5/5] Creando carpetas media...
if not exist "media\barberos" mkdir media\barberos
echo ✓ Carpetas creadas
echo.

echo ══════════════════════════════════════
echo   ✅ INSTALACIÓN COMPLETADA
echo ══════════════════════════════════════
echo.
echo Próximos pasos:
echo 1. Crear superusuario (opción 3)
echo 2. Cargar datos de prueba (opción 4)
echo 3. Iniciar servidor (opción 2)
echo.
pause
goto MENU

:RUNSERVER
echo.
echo ══════════════════════════════════════
echo   INICIANDO SERVIDOR
echo ══════════════════════════════════════
echo.
call venv\Scripts\activate.bat
echo Servidor corriendo en: http://localhost:8000
echo Admin disponible en: http://localhost:8000/admin/
echo API REST disponible en: http://localhost:8000/api/
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
python manage.py runserver
goto MENU

:SUPERUSER
echo.
echo ══════════════════════════════════════
echo   CREAR SUPERUSUARIO
echo ══════════════════════════════════════
echo.
call venv\Scripts\activate.bat
python manage.py createsuperuser
echo.
pause
goto MENU

:LOADDATA
echo.
echo ══════════════════════════════════════
echo   CARGAR DATOS DE PRUEBA
echo ══════════════════════════════════════
echo.
call venv\Scripts\activate.bat
python manage.py load_data
echo.
pause
goto MENU

:MIGRATE
echo.
echo ══════════════════════════════════════
echo   MIGRACIONES
echo ══════════════════════════════════════
echo.
call venv\Scripts\activate.bat
python manage.py makemigrations
python manage.py migrate
echo ✓ Migraciones completadas
echo.
pause
goto MENU

:TESTS
echo.
echo ══════════════════════════════════════
echo   EJECUTAR TESTS
echo ══════════════════════════════════════
echo.
call venv\Scripts\activate.bat
python manage.py test turnos
echo.
pause
goto MENU

:SALIR
echo.
echo ¡Hasta pronto!
exit
