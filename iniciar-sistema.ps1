# Agenda Inteligente - Script de Inicialização
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Agenda Inteligente - Iniciar Sistema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "[1/4] Verificando Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop não está rodando!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Inicie o Docker Desktop" -ForegroundColor White
    Write-Host "2. Aguarde alguns segundos até estar pronto" -ForegroundColor White
    Write-Host "3. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar/Iniciar MongoDB
Write-Host "[2/4] Verificando MongoDB..." -ForegroundColor Yellow
$mongoRunning = docker ps --filter "name=mongodb" --format "{{.Names}}" 2>$null
if ($mongoRunning -eq "mongodb") {
    Write-Host "✅ MongoDB já está rodando" -ForegroundColor Green
} else {
    Write-Host "Iniciando MongoDB no Docker..." -ForegroundColor White
    docker rm -f mongodb 2>$null | Out-Null
    docker run -d -p 27017:27017 --name mongodb mongo:latest | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB iniciado com sucesso!" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } else {
        Write-Host "❌ Erro ao iniciar MongoDB" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[3/4] Iniciando Backend (Port 3001)..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend - Agenda Inteligente' -ForegroundColor Green; node src/server.js"
Write-Host "✅ Backend iniciando..." -ForegroundColor Green

Start-Sleep -Seconds 3

Write-Host "[4/4] Iniciando Frontend (Port 5173)..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend - Agenda Inteligente' -ForegroundColor Green; npm run dev"
Write-Host "✅ Frontend iniciando..." -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Sistema Iniciado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Blue
Write-Host "Frontend: " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Blue
Write-Host "MongoDB:  " -NoNewline; Write-Host "mongodb://localhost:27017" -ForegroundColor Blue
Write-Host ""
Write-Host "Dashboard Admin: " -NoNewline; Write-Host "http://localhost:5173/admin/dashboard" -ForegroundColor Magenta
Write-Host ""
