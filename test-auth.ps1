# Script para testar autenticação via API
# Uso: .\test-auth.ps1

param(
    [string]$Action = "all",  # signup, login, google, health, all
    [string]$Email = "joao@example.com",
    [string]$Phone = "11999999999",
    [string]$Password = "Senha123!",
    [string]$Name = "Joao Silva"
)

$API_URL = "http://localhost:3001"
$Results = @()

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n$('='*60)" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "$('='*60)" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Test {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# ============ TEST 1: HEALTH CHECK ============
if ($Action -eq "health" -or $Action -eq "all") {
    Write-TestHeader "TEST 1: HEALTH CHECK"
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/health" -ErrorAction Stop
        Write-Success "Backend está respondendo"
        Write-Host "Status: $($response.StatusCode)"
        Write-Host "Body: $($response.Content)"
        $Results += "✅ Health Check"
    } catch {
        Write-Error-Test "Backend não está respondendo"
        Write-Host "Erro: $_"
        $Results += "❌ Health Check"
        exit 1
    }
}

# ============ TEST 2: SIGNUP COM EMAIL ============
if ($Action -eq "signup" -o $Action -eq "all") {
    Write-TestHeader "TEST 2: SIGNUP COM EMAIL"
    
    $body = @{
        name = $Name
        email = $Email
        phone = $Phone
        password = $Password
    } | ConvertTo-Json
    
    Write-Info "Enviando: $body"
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/signup" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.ok) {
            Write-Success "Usuário criado com sucesso"
            Write-Host "ID: $($data.user.id)"
            Write-Host "Email: $($data.user.email)"
            Write-Host "Name: $($data.user.name)"
            Write-Host "Token: $($data.token.Substring(0, 20))..." -ForegroundColor Gray
            
            # Salvar token para teste de login
            $global:SignupToken = $data.token
            $global:UserId = $data.user.id
            
            $Results += "✅ Signup"
        } else {
            Write-Error-Test "Erro ao cadastrar: $($data.errors -join ', ')"
            $Results += "❌ Signup"
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq "BadRequest") {
            Write-Error-Test "Email ou dados inválidos"
        } elseif ($_.Exception.Response.StatusCode -eq "InternalServerError") {
            Write-Error-Test "Erro no servidor (verifique se PostgreSQL está rodando)"
        } else {
            Write-Error-Test "Erro na requisição: $_"
        }
        $Results += "❌ Signup"
    }
}

# ============ TEST 3: LOGIN COM EMAIL ============
if ($Action -eq "login" -o $Action -eq "all") {
    Write-TestHeader "TEST 3: LOGIN COM EMAIL"
    
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    Write-Info "Enviando: $body"
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.ok) {
            Write-Success "Login com email bem-sucedido"
            Write-Host "ID: $($data.user.id)"
            Write-Host "Email: $($data.user.email)"
            Write-Host "Token: $($data.token.Substring(0, 20))..." -ForegroundColor Gray
            
            $global:LoginToken = $data.token
            $Results += "✅ Login (Email)"
        } else {
            Write-Error-Test "Erro ao fazer login: $($data.errors -join ', ')"
            $Results += "❌ Login (Email)"
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
            Write-Error-Test "Email ou senha inválidos"
        } elseif ($_.Exception.Response.StatusCode -eq "BadRequest") {
            Write-Error-Test "Email/telefone ou dados inválidos"
        } else {
            Write-Error-Test "Erro na requisição: $_"
        }
        $Results += "❌ Login (Email)"
    }
}

# ============ TEST 4: LOGIN COM TELEFONE ============
if ($Action -eq "login" -o $Action -eq "all") {
    Write-TestHeader "TEST 4: LOGIN COM TELEFONE"
    
    $body = @{
        phone = $Phone
        password = $Password
    } | ConvertTo-Json
    
    Write-Info "Enviando: $body"
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.ok) {
            Write-Success "Login com telefone bem-sucedido"
            Write-Host "ID: $($data.user.id)"
            Write-Host "Email: $($data.user.email)"
            Write-Host "Token: $($data.token.Substring(0, 20))..." -ForegroundColor Gray
            
            $Results += "✅ Login (Telefone)"
        } else {
            Write-Error-Test "Erro ao fazer login: $($data.errors -join ', ')"
            $Results += "❌ Login (Telefone)"
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
            Write-Error-Test "Telefone ou senha inválidos"
        } else {
            Write-Error-Test "Erro na requisição: $_"
        }
        $Results += "❌ Login (Telefone)"
    }
}

# ============ RELATÓRIO FINAL ============
Write-TestHeader "RELATÓRIO FINAL"
Write-Host ""
$Results | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Testes concluídos em $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray

# ============ RECOMENDAÇÕES ============
Write-Host "`n" -ForegroundColor Cyan
Write-Host "📋 Próximas etapas:" -ForegroundColor Yellow
Write-Host "  1. Testar Google Sign-In no navegador (requer Client ID)"
Write-Host "  2. Testar frontend em http://localhost:5176"
Write-Host "  3. Começar Phase 2 (Pix dinâmico + WhatsApp real)"
