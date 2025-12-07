# Script para instalar e configurar PostgreSQL 16 via Docker
# Uso: .\setup-postgres.ps1

Write-Host "🐘 Agenda Inteligente - PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Verificar se Docker está instalado
Write-Host "`n[1/4] Verificando Docker..." -ForegroundColor Yellow
$docker = docker --version 2>$null
if ($docker) {
    Write-Host "✅ Docker detectado: $docker" -ForegroundColor Green
} else {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "   Instale em: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Parar e remover container anterior (se existir)
Write-Host "`n[2/4] Verificando containers anteriores..." -ForegroundColor Yellow
$existing = docker ps -a --filter "name=agenda-db" -q 2>$null
if ($existing) {
    Write-Host "   Removendo container anterior..." -ForegroundColor Gray
    docker stop agenda-db 2>$null
    docker rm agenda-db 2>$null
    Write-Host "✅ Container anterior removido" -ForegroundColor Green
} else {
    Write-Host "✅ Nenhum container anterior encontrado" -ForegroundColor Green
}

# Iniciar PostgreSQL 16
Write-Host "`n[3/4] Iniciando PostgreSQL 16..." -ForegroundColor Yellow
docker run --name agenda-db `
    -e POSTGRES_USER=app `
    -e POSTGRES_PASSWORD=app `
    -e POSTGRES_DB=agenda `
    -p 5432:5432 `
    -v postgres_data:/var/lib/postgresql/data `
    -d postgres:16 2>$null

if ($?) {
    Write-Host "✅ Container iniciado com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao iniciar container" -ForegroundColor Red
    exit 1
}

# Aguardar inicialização (max 10 segundos)
Write-Host "`n[4/4] Aguardando inicialização do PostgreSQL..." -ForegroundColor Yellow
$attempts = 0
$max_attempts = 10
while ($attempts -lt $max_attempts) {
    $health = docker exec agenda-db pg_isready -U app 2>$null
    if ($?) {
        Write-Host "✅ PostgreSQL está pronto!" -ForegroundColor Green
        break
    }
    Write-Host "   Tentativa $($attempts + 1)/$max_attempts..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    $attempts++
}

if ($attempts -eq $max_attempts) {
    Write-Host "⚠️  PostgreSQL pode levar mais tempo para inicializar" -ForegroundColor Yellow
}

# Exibir resumo
Write-Host "`n" -ForegroundColor Cyan
Write-Host "✅ SETUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📋 Detalhes da Conexão:" -ForegroundColor Yellow
Write-Host "  Host:     localhost" -ForegroundColor White
Write-Host "  Port:     5432" -ForegroundColor White
Write-Host "  User:     app" -ForegroundColor White
Write-Host "  Password: app" -ForegroundColor White
Write-Host "  Database: agenda" -ForegroundColor White
Write-Host "  URL:      postgresql://app:app@localhost:5432/agenda" -ForegroundColor White

Write-Host "`n📝 Próximas etapas:" -ForegroundColor Yellow
Write-Host "  1. Inicie o backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Inicie o frontend: cd frontend && npm run dev -- --host" -ForegroundColor White
Write-Host "  3. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "  4. Crie uma conta para testar!" -ForegroundColor White

Write-Host "`n🐳 Gerenciar container:" -ForegroundColor Yellow
Write-Host "  Ver logs:   docker logs -f agenda-db" -ForegroundColor Gray
Write-Host "  Parar:      docker stop agenda-db" -ForegroundColor Gray
Write-Host "  Reiniciar:  docker start agenda-db" -ForegroundColor Gray
Write-Host "  Remover:    docker rm -f agenda-db" -ForegroundColor Gray

Write-Host "`n"
