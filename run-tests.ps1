#!/usr/bin/env pwsh

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Executando suíte de testes completa" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$frontendPath = "frontend"
$backendPath = "backend"

Write-Host "`n[1/3] Testando Frontend..." -ForegroundColor Yellow
Push-Location $frontendPath
npm test -- --passWithNoTests --coverage
$frontendResult = $LASTEXITCODE
Pop-Location

Write-Host "`n[2/3] Testando Backend..." -ForegroundColor Yellow
Push-Location $backendPath
npm test -- --passWithNoTests --coverage
$backendResult = $LASTEXITCODE
Pop-Location

Write-Host "`n[3/3] Resumo de resultados:" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

if ($frontendResult -eq 0) {
    Write-Host "✓ Testes Frontend: PASSOU" -ForegroundColor Green
} else {
    Write-Host "✗ Testes Frontend: FALHOU" -ForegroundColor Red
}

if ($backendResult -eq 0) {
    Write-Host "✓ Testes Backend: PASSOU" -ForegroundColor Green
} else {
    Write-Host "✗ Testes Backend: FALHOU" -ForegroundColor Red
}

Write-Host "`n=====================================" -ForegroundColor Cyan

if ($frontendResult -eq 0 -and $backendResult -eq 0) {
    Write-Host "Todos os testes passaram! ✓" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Alguns testes falharam. Verifique os logs acima." -ForegroundColor Red
    exit 1
}
