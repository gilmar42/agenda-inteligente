@echo off
echo ========================================
echo   Agenda Inteligente - Iniciar Sistema
echo ========================================
echo.

echo [1/4] Verificando Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop nao esta rodando.
    echo Por favor, inicie o Docker Desktop manualmente e aguarde alguns segundos.
    echo Depois execute este script novamente.
    pause
    exit /b 1
)

echo [2/4] Verificando se MongoDB ja esta rodando...
docker ps | findstr mongodb >nul 2>&1
if %errorlevel% equ 0 (
    echo MongoDB ja esta rodando!
) else (
    echo Iniciando MongoDB no Docker...
    docker run -d -p 27017:27017 --name mongodb mongo:latest
    if %errorlevel% equ 0 (
        echo MongoDB iniciado com sucesso!
        timeout /t 5 /nobreak >nul
    ) else (
        echo Tentando remover container antigo...
        docker rm -f mongodb >nul 2>&1
        docker run -d -p 27017:27017 --name mongodb mongo:latest
        timeout /t 5 /nobreak >nul
    )
)

echo.
echo [3/4] Iniciando Backend (Port 3001)...
cd /d "%~dp0backend"
start "Backend - Agenda Inteligente" cmd /k "node src/server.js"

timeout /t 3 /nobreak >nul

echo [4/4] Iniciando Frontend (Port 5173)...
cd /d "%~dp0frontend"
start "Frontend - Agenda Inteligente" cmd /k "npm run dev"

echo.
echo ========================================
echo   Sistema Iniciado!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo MongoDB:  mongodb://localhost:27017
echo.
echo Pressione qualquer tecla para sair...
pause >nul
