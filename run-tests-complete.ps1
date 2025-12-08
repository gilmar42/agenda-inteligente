#!/usr/bin/env pwsh
# Test runner script for agenda inteligente

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Sistema de Testes - Agenda Inteligente" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get the workspace root
$rootDir = Split-Path -Parent $PSScriptRoot

# Colors for output
function Write-Section {
  param([string]$title)
  Write-Host ""
  Write-Host "▶ $title" -ForegroundColor Yellow
  Write-Host "─" * 50 -ForegroundColor Gray
}

function Write-Success {
  param([string]$message)
  Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Error-Msg {
  param([string]$message)
  Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Info {
  param([string]$message)
  Write-Host "ℹ $message" -ForegroundColor Blue
}

# Clean previous test runs
Write-Section "Limpando testes anteriores"
Remove-Item "$rootDir/backend/coverage" -Recurse -ErrorAction SilentlyContinue
Remove-Item "$rootDir/frontend/coverage" -Recurse -ErrorAction SilentlyContinue
Write-Success "Diretórios de cobertura limpos"

# Check if backend server is running
Write-Section "Verificando servidor backend"
try {
  $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
  if ($healthCheck.StatusCode -eq 200) {
    Write-Success "Backend já está rodando"
    $backendRunning = $true
  } else {
    Write-Info "Backend não está respondendo"
    $backendRunning = $false
  }
} catch {
  Write-Info "Backend não está disponível"
  $backendRunning = $false
}

# Start backend if not running
if (-not $backendRunning) {
  Write-Section "Iniciando servidor backend"
  Push-Location "$rootDir/backend"
  Start-Job -ScriptBlock { npm start 2>&1 } -Name "backend" | Out-Null
  Write-Info "Backend iniciado em background"
  Write-Info "Aguardando 5 segundos para servidor iniciar..."
  Start-Sleep -Seconds 5
  Pop-Location
}

# Run backend tests
Write-Section "Executando testes do backend"
Push-Location "$rootDir/backend"

Write-Info "Executando testes com cobertura..."
& npm test -- --coverage --testPathPattern="(health|auth|admin|integration|signup)" 2>&1 | Tee-Object -Variable backendTestOutput

if ($LASTEXITCODE -eq 0) {
  Write-Success "Testes do backend passaram!"
} else {
  Write-Error-Msg "Testes do backend falharam (código de saída: $LASTEXITCODE)"
}

Pop-Location

# Run frontend tests
Write-Section "Executando testes do frontend"
Push-Location "$rootDir/frontend"

Write-Info "Executando testes com cobertura..."
& npm test -- --coverage --testPathPattern="(AdminDashboard|Login|Signup|AuthContext)" --no-coverage 2>&1 | Tee-Object -Variable frontendTestOutput

if ($LASTEXITCODE -eq 0) {
  Write-Success "Testes do frontend passaram!"
} else {
  Write-Error-Msg "Testes do frontend falharam (código de saída: $LASTEXITCODE)"
}

Pop-Location

# Summary
Write-Section "Resumo dos Testes"
Write-Host ""
Write-Host "Backend:" -ForegroundColor Cyan
Write-Host "  - Testes de autenticação" -ForegroundColor Gray
Write-Host "  - Testes de admin/dashboard" -ForegroundColor Gray
Write-Host "  - Testes de integração" -ForegroundColor Gray
Write-Host "  - Testes de saúde" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "  - Testes do painel de admin" -ForegroundColor Gray
Write-Host "  - Testes de formulários" -ForegroundColor Gray
Write-Host "  - Testes de autenticação" -ForegroundColor Gray
Write-Host "  - Testes de contexto" -ForegroundColor Gray
Write-Host ""

Write-Host "Cobertura:" -ForegroundColor Cyan
if (Test-Path "$rootDir/backend/coverage/coverage-summary.json") {
  Write-Success "Relatório de cobertura backend disponível"
}
if (Test-Path "$rootDir/frontend/coverage/coverage-summary.json") {
  Write-Success "Relatório de cobertura frontend disponível"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testes Concluídos!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

# Cleanup background jobs
Get-Job -ErrorAction SilentlyContinue | Stop-Job
