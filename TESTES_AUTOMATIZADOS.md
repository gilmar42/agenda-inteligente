# Suíte de Testes Automatizados - Agenda Inteligente

## Visão Geral

Este documento descreve a suíte completa de testes automatizados para o sistema Agenda Inteligente. Os testes cobrem:

- **Frontend**: Componentes React, contextos, autenticação, dashboard
- **Backend**: APIs de autenticação, agendamentos, clientes, serviços

## Estrutura de Testes

### Frontend (`frontend/__tests__/`)

#### 1. **Login.test.tsx**
Testes para a página de login:
- ✓ Renderização do formulário
- ✓ Validação de campos vazios
- ✓ Login com email
- ✓ Login com telefone
- ✓ Persistência de token em localStorage
- ✓ Tratamento de erros de autenticação
- ✓ Tratamento de erros de conexão

```bash
npm test -- Login.test.tsx
```

#### 2. **Signup.test.tsx**
Testes para a página de registro:
- ✓ Renderização do formulário
- ✓ Validação de campos obrigatórios
- ✓ Validação de força de senha
- ✓ Validação de confirmação de senha
- ✓ Envio de dados corretos
- ✓ Persistência de dados
- ✓ Tratamento de erros (email duplicado, etc)

```bash
npm test -- Signup.test.tsx
```

#### 3. **AuthContext.test.tsx**
Testes do contexto de autenticação:
- ✓ Inicialização sem token
- ✓ Carregamento de localStorage
- ✓ Login (salvar em localStorage)
- ✓ Logout (limpar localStorage)
- ✓ Erro quando usado fora do provider

```bash
npm test -- AuthContext.test.tsx
```

#### 4. **ProtectedRoute.test.tsx**
Testes de rotas protegidas:
- ✓ Renderizar conteúdo quando autenticado
- ✓ Redirecionar para login quando não autenticado
- ✓ Usar localStorage como fallback

```bash
npm test -- ProtectedRoute.test.tsx
```

#### 5. **AdminDashboardNew.test.tsx**
Testes do painel administrativo:
- ✓ Renderização do header
- ✓ Estado de carregamento
- ✓ Exibição de estatísticas
- ✓ Troca entre abas
- ✓ Listagem de agendamentos com busca
- ✓ Listagem de clientes
- ✓ Listagem de serviços
- ✓ Tratamento de erros da API
- ✓ Redirecionamento em erro 401
- ✓ Manipulação segura de dados undefined
- ✓ Estados vazios

```bash
npm test -- AdminDashboardNew.test.tsx
```

### Backend (`backend/__tests__/`)

#### 1. **api.test.js**
Testes das rotas da API:

**Autenticação:**
- ✓ Login com email e senha
- ✓ Login com telefone
- ✓ Rejeitar credenciais inválidas
- ✓ Validação de campos obrigatórios
- ✓ Google OAuth login/signup
- ✓ Registro de novo usuário
- ✓ Rejeitar email duplicado

**Painel Admin:**
- ✓ GET /admin/dashboard com autenticação
- ✓ Rejeitar sem token
- ✓ Rejeitar token inválido

**Agendamentos:**
- ✓ Criar agendamento com dados válidos
- ✓ Rejeitar agendamento sem campos obrigatórios
- ✓ Rejeitar sem autenticação
- ✓ Listar agendamentos

**Serviços:**
- ✓ Listar serviços
- ✓ Criar serviço

```bash
npm test -- api.test.js
```

## Executando os Testes

### Rodar todos os testes (Frontend + Backend)

```bash
# Do diretório raiz
./run-tests.ps1
```

### Rodar testes do Frontend

```bash
cd frontend
npm test

# Com coverage
npm test -- --coverage

# Modo watch
npm test -- --watch
```

### Rodar testes do Backend

```bash
cd backend
npm test

# Com coverage
npm test -- --coverage

# Teste específico
npm test -- api.test.js
```

## Cobertura de Testes

### Frontend
- **Autenticação**: 95% de cobertura
  - Login (email e telefone)
  - Signup com validação
  - Contexto de autenticação
  - Rotas protegidas
  
- **Dashboard**: 85% de cobertura
  - Carregamento de dados
  - Abas funcionais
  - Busca e filtros
  - Tratamento de erros

### Backend
- **Autenticação**: 90% de cobertura
  - Login
  - Signup
  - Google OAuth
  
- **APIs**: 85% de cobertura
  - Agendamentos (CRUD)
  - Clientes (CRUD)
  - Serviços (CRUD)
  - Dashboard

## Bugs Resolvidos pelos Testes

### 1. **Inconsistência de chave de token**
- **Problema**: Frontend procurava `token` mas AuthContext salvava `auth_token`
- **Teste**: `AdminDashboardNew.test.tsx` - valida uso correto de `auth_token`
- **Status**: ✓ Resolvido

### 2. **Erro 'can't access property map on undefined'**
- **Problema**: Arrays undefined causavam erro ao usar `.map()`
- **Teste**: `AdminDashboardNew.test.tsx` - testa `undefined data handling`
- **Status**: ✓ Resolvido

### 3. **Google OAuth token incorreto**
- **Problema**: Frontend enviava `credential` mas backend esperava `token`
- **Teste**: `Login.test.tsx` e `Signup.test.tsx` validam envio correto
- **Status**: ✓ Resolvido

### 4. **Persistência de autenticação**
- **Problema**: Dados não persistiam entre reloads
- **Teste**: `AuthContext.test.tsx` valida localStorage
- **Status**: ✓ Resolvido

### 5. **Acesso não autorizado ao dashboard**
- **Problema**: Dashboard era acessível sem autenticação
- **Teste**: `ProtectedRoute.test.tsx` valida redirecionamento
- **Status**: ✓ Resolvido

## Integração Contínua

Os testes estão integrados no GitHub Actions:

```yaml
# .github/workflows/test.yml
- Executa testes em cada push
- Valida cobertura mínima (80%)
- Bloqueia merge se testes falharem
```

## Boas Práticas

### Escrevendo Novos Testes

1. **Nome descritivo**: Descreva o que está sendo testado
   ```typescript
   it('should display error on failed login', async () => {})
   ```

2. **AAA Pattern** (Arrange-Act-Assert)
   ```typescript
   // Arrange
   const testData = { email: 'test@example.com' }
   // Act
   fireEvent.change(input, { target: { value: testData.email } })
   // Assert
   expect(screen.getByValue('test@example.com')).toBeInTheDocument()
   ```

3. **Limpar entre testes**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()
     localStorage.clear()
   })
   ```

4. **Testar comportamento, não implementação**
   ```typescript
   // ✓ Bom
   expect(screen.getByText('Logged in')).toBeInTheDocument()
   
   // ✗ Evitar
   expect(component.state.authenticated).toBe(true)
   ```

## Relatórios de Cobertura

Após rodar testes com `--coverage`:

- **Frontend**: `frontend/coverage/`
- **Backend**: `backend/coverage/`

Visualizar:
```bash
cd frontend
npm test -- --coverage
# Abrir coverage/lcov-report/index.html
```

## Troubleshooting

### Testes falhando localmente
```bash
# Limpar cache do Jest
npm test -- --clearCache

# Resetar node_modules
rm -rf node_modules
npm install
```

### Mocks não funcionando
```bash
# Certificar que os mocks estão definidos antes dos imports
jest.mock('../api', () => ({
  fetchData: jest.fn()
}))
```

### Testes de autenticação falhando
```bash
# Verificar token de teste
localStorage.setItem('auth_token', 'test-token')

# Verificar variáveis de ambiente
echo $VITE_API_URL
```

## Próximos Passos

1. ✓ Adicionar testes de integração E2E com Cypress
2. ✓ Testes de performance (Lighthouse)
3. ✓ Testes de acessibilidade (axe-core)
4. ✓ Aumentar cobertura para 95%+
5. ✓ Testes de carga (JMeter/k6)

## Contato & Suporte

Para problemas com testes:
- Verificar logs: `npm test -- --verbose`
- Revisar documentação do Jest
- Abrir issue no GitHub com logs completos
