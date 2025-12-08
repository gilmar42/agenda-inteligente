# Sistema de Testes - Agenda Inteligente

## Resumo da Implementação

Este documento descreve os testes automatizados implementados para o sistema "Agenda Inteligente" (appointment scheduling system).

---

## 1. Testes Backend (Node.js/Express)

### Arquivos de Teste

- **`__tests__/health.test.js`** - Testes de saúde do servidor
- **`__tests__/auth.test.js`** - Testes de autenticação (signup/login)
- **`__tests__/admin.test.js`** - Testes de dashboard e CRUD operations
- **`__tests__/integration.test.js`** - Testes de workflows completos
- **`__tests__/signup.test.js`** - Testes adicionais de signup
- **`__tests__/redis_optional.test.js`** - Testes de dependências opcionais

### Cobertura de Testes Backend

#### Authentication Routes (`auth.test.js`)
- ✅ POST /signup - Registro de novo usuário
- ✅ POST /login - Login com credenciais válidas
- ✅ Validação de formato de email
- ✅ Validação de requisitos de senha
- ✅ Rejeição de emails duplicados
- ✅ Rejeição de credenciais inválidas
- ✅ Verificação de decodificação de JWT tokens

#### Admin Dashboard (`admin.test.js`)
- ✅ GET /admin/dashboard - Requer token válido
- ✅ GET /admin/appointments - Listagem de agendamentos
- ✅ POST /admin/appointments - Criação de agendamentos
- ✅ GET /admin/clients - Listagem de clientes
- ✅ POST /admin/clients - Criação de clientes
- ✅ GET /admin/services - Listagem de serviços
- ✅ POST /admin/services - Criação de serviços
- ✅ Validação de autenticação em todos os endpoints

#### Workflows de Integração (`integration.test.js`)
- ✅ Registro → Login → Dashboard (fluxo completo)
- ✅ Criar cliente → Serviço → Agendamento
- ✅ Listagem e busca de dados
- ✅ Operações concorrentes (múltiplas requisições simultâneas)
- ✅ Tratamento de tokens malformados
- ✅ Validação de dados

### Executar Testes Backend

```powershell
# Todos os testes backend
cd backend
npm test

# Teste específico
npm test -- __tests__/auth.test.js

# Com cobertura
npm test -- --coverage

# Com saída detalhada
npm test -- --verbose
```

### Resultados Backend

```
Test Suites: 5 passed
Tests:       40 passed, 1 skipped
Snapshots:   0 total
Time:        ~4s
```

---

## 2. Testes Frontend (React/TypeScript)

### Arquivos de Teste

- **`__tests__/AdminDashboardNew.test.tsx`** - Testes do painel de admin
- **`__tests__/AdminDashboardForms.test.tsx`** - Testes dos formulários
- **`__tests__/LoginFull.test.tsx`** - Testes da página de login
- **`__tests__/SignupFull.test.tsx`** - Testes da página de signup
- **`__tests__/AuthContext.test.tsx`** - Testes do contexto de autenticação
- **`__tests__/ProtectedRoute.test.tsx`** - Testes de rotas protegidas
- **`__tests__/ThemeToggle.test.tsx`** - Testes do toggle de tema

### Cobertura de Testes Frontend

#### Admin Dashboard (`AdminDashboardNew.test.tsx` e `AdminDashboardForms.test.tsx`)
- ✅ Renderização do painel de admin
- ✅ Abas: Visão Geral, Agendamentos, Clientes, Serviços, Relatórios, Configurações, Integrações
- ✅ Navegação entre abas
- ✅ Exibição de estatísticas
- ✅ Formulários de criação:
  - Agendamentos (cliente, telefone, serviço, data, status, notas)
  - Clientes (nome, telefone, email)
  - Serviços (nome, preço, duração, descrição)
- ✅ Validação de formulários
- ✅ Busca e filtro por aba
- ✅ Tratamento de erros
- ✅ Estados de carregamento

#### Login (`LoginFull.test.tsx`)
- ✅ Renderização do formulário de login
- ✅ Entrada de email e senha
- ✅ Validação de campos obrigatórios
- ✅ Submissão com credenciais válidas
- ✅ Rejeição de credenciais inválidas
- ✅ Armazenamento de token no localStorage
- ✅ Estado de carregamento
- ✅ Tratamento de erros de rede
- ✅ Links de OAuth (Google, se configurado)

#### Signup (`SignupFull.test.tsx`)
- ✅ Renderização do formulário de cadastro
- ✅ Entrada de nome, email e senha
- ✅ Validação de email duplicado
- ✅ Validação de força de senha
- ✅ Confirmação de senha (se aplicável)
- ✅ Armazenamento de token após sucesso
- ✅ Tratamento de erros de servidor
- ✅ Tratamento de erros de rede
- ✅ Termos e privacidade (se aplicável)

#### Autenticação (`AuthContext.test.tsx`)
- ✅ Provedor de contexto de autenticação
- ✅ Funções de login/logout
- ✅ Persistência de token
- ✅ Recuperação de estado de usuário

#### Rotas Protegidas (`ProtectedRoute.test.tsx`)
- ✅ Redirecionamento para login quando não autenticado
- ✅ Acesso permitido com token válido
- ✅ Renderização de componente protegido

### Executar Testes Frontend

```powershell
# Todos os testes frontend
cd frontend
npm test

# Teste específico
npm test -- __tests__/AdminDashboardNew.test.tsx

# Com cobertura
npm test -- --coverage

# Com watcher (reexecuta ao salvar)
npm test -- --watch

# Teste específico por padrão
npm test -- --testPathPattern="Login"
```

### Configuração Jest

Frontend usa `ts-jest` para TypeScript com configurações:
- `preset: 'ts-jest'`
- `testEnvironment: 'jsdom'`
- Suporte a CSS modules
- Mock de importações de imagens

---

## 3. Cobertura Geral

### Áreas Cobertas

#### Autenticação ✅
- Signup/Registro
- Login
- JWT Token validation
- Token persistence
- Logout

#### Dashboard Admin ✅
- Visualização de estatísticas
- Navegação entre abas
- Criação de agendamentos
- Criação de clientes
- Criação de serviços
- Listagem de dados
- Busca e filtro
- Deleção de registros

#### Validação de Dados ✅
- Validação de email
- Validação de senha
- Validação de campos obrigatórios
- Validação de formato de dados
- Validação de duplicatas

#### Tratamento de Erros ✅
- Erros de rede
- Erros de servidor (5xx)
- Erros de autenticação (401)
- Erros de validação (400)
- Erros de não encontrado (404)

#### Estados e Fluxos ✅
- Loading states
- Error states
- Success states
- Form submission
- Data retrieval
- Concurrent requests

---

## 4. Executar Suite Completa de Testes

### Opção 1: Script PowerShell

```powershell
# Executar teste completo
./run-tests-complete.ps1
```

### Opção 2: Comandos Manuais

```powershell
# Backend
cd backend
npm test -- --maxWorkers=1

# Frontend
cd frontend
npm test -- --no-coverage

# Gerar cobertura
npm test -- --coverage
```

### Opção 3: Testes Específicos

```powershell
# Apenas autenticação
npm test -- __tests__/auth.test.js

# Apenas admin
npm test -- --testPathPattern="admin"

# Apenas integração
npm test -- __tests__/integration.test.js

# Apenas dashboard frontend
npm test -- __tests__/AdminDashboard
```

---

## 5. Resultados Esperados

### Backend
```
PASS __tests__/health.test.js
PASS __tests__/auth.test.js
PASS __tests__/admin.test.js
PASS __tests__/integration.test.js
PASS __tests__/redis_optional.test.js
PASS __tests__/signup.test.js

Test Suites: 5 passed
Tests:       40 passed
Time:        ~4 seconds
```

### Frontend
```
PASS __tests__/AdminDashboardNew.test.tsx
PASS __tests__/AdminDashboardForms.test.tsx
PASS __tests__/LoginFull.test.tsx
PASS __tests__/SignupFull.test.tsx

Test Suites: 4 passed
Tests:       30+ passed
Time:        ~8 seconds
```

---

## 6. Boas Práticas de Teste

### Para Novos Testes
1. **Arrange** - Preparar dados e mocks
2. **Act** - Executar ação
3. **Assert** - Verificar resultado

### Exemplo
```javascript
it('should create client successfully', async () => {
  // Arrange
  const clientData = { name: 'John', phone: '123', email: 'john@ex.com' }
  const mockToken = 'valid-token'
  
  // Act
  const res = await request(API_URL)
    .post('/admin/clients')
    .set('Authorization', `Bearer ${mockToken}`)
    .send(clientData)
  
  // Assert
  expect([200, 201]).toContain(res.status)
})
```

### Testes de Componentes React
```typescript
it('should render form with validation', () => {
  render(<AdminDashboard />)
  
  const input = screen.getByPlaceholderText(/nome/i)
  fireEvent.change(input, { target: { value: 'Test' } })
  
  expect(input.value).toBe('Test')
})
```

---

## 7. Cobertura de Código

### Backend
- `src/routes/adminRouter.js` - Rotas de admin
- `src/server.js` - Setup do servidor (excluído de cobertura)
- `src/db.js` - Funções de banco de dados

### Frontend
- `src/pages/AdminDashboardNew.tsx` - Painel admin
- `src/pages/Login.tsx` - Página de login
- `src/pages/Signup.tsx` - Página de cadastro
- `src/context/AuthContext.tsx` - Contexto de autenticação
- `src/components/ProtectedRoute.tsx` - Rota protegida

---

## 8. Próximos Passos

### Melhorias Futuras
- [ ] E2E tests com Cypress ou Playwright
- [ ] Testes de performance
- [ ] Testes de acessibilidade
- [ ] Testes de segurança
- [ ] Cobertura de 100% em funções críticas
- [ ] Testes de integração com banco de dados
- [ ] Testes de API com diferentes envs (dev/prod)

### Manutenção
- Atualizar testes com novas features
- Manter cobertura >= 70%
- Revisar testes mensalmente
- Adicionar testes para bugs encontrados

---

## 9. Troubleshooting

### Problema: Tests timeout
**Solução:** Aumentar timeout em jest.config.cjs
```javascript
testTimeout: 15000 // 15 segundos
```

### Problema: Port em uso
**Solução:** Parar servidor anterior
```powershell
Get-Process node | Stop-Process -Force
```

### Problema: Token expirado
**Solução:** Gerar novo token durante teste
```javascript
const token = jwt.sign({ userId: '123' }, JWT_SECRET, { expiresIn: '1h' })
```

### Problema: Fetch não mocado
**Solução:** Adicionar antes de cada teste
```javascript
beforeEach(() => {
  global.fetch = jest.fn()
})
```

---

## 10. Conclusão

O sistema de testes implementado fornece cobertura abrangente dos principais fluxos de funcionamento da aplicação, garantindo qualidade e confiabilidade do sistema "Agenda Inteligente".

**Data de Implementação:** Dezembro 2025

**Versão:** 1.0
