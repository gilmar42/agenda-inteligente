# Start all services for local development
Write-Host "Starting Agenda Inteligente services..." -ForegroundColor Green

# Backend
Write-Host "`n[1/3] Starting Backend (port 3001)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '.\backend'; npm run dev"

# AI Service
Write-Host "[2/3] Starting AI Service (port 5000)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '.\ai-service'; .\.venv\Scripts\Activate.ps1; python app.py"

# Frontend
Write-Host "[3/3] Starting Frontend (port 5173)..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '.\frontend'; npm run dev -- --host"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "`nHealth checks:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:3001/health"
Write-Host "  AI:       http://localhost:5000/health"
Write-Host "  Frontend: http://localhost:5173"
