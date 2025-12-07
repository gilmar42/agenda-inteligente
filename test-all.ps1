# Run all tests
Write-Host "Running all tests..." -ForegroundColor Green

# Backend
Write-Host "`n[1/3] Backend tests..." -ForegroundColor Cyan
Push-Location .\backend
npm test
$backendResult = $LASTEXITCODE
Pop-Location

# Frontend
Write-Host "`n[2/3] Frontend tests..." -ForegroundColor Cyan
Push-Location .\frontend
npm test -- --watchAll=false
$frontendResult = $LASTEXITCODE
Pop-Location

# AI Service
Write-Host "`n[3/3] AI Service tests..." -ForegroundColor Cyan
Push-Location .\ai-service
.\.venv\Scripts\Activate.ps1
pytest
$aiResult = $LASTEXITCODE
deactivate
Pop-Location

Write-Host "`n📊 Test Summary:" -ForegroundColor Yellow
Write-Host "  Backend:  $(if ($backendResult -eq 0) { '✅ PASS' } else { '❌ FAIL' })"
Write-Host "  Frontend: $(if ($frontendResult -eq 0) { '✅ PASS' } else { '❌ FAIL' })"
Write-Host "  AI:       $(if ($aiResult -eq 0) { '✅ PASS' } else { '❌ FAIL' })"

if ($backendResult -eq 0 -and $frontendResult -eq 0 -and $aiResult -eq 0) {
  Write-Host "`n✅ All tests passed!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "`n❌ Some tests failed." -ForegroundColor Red
  exit 1
}
