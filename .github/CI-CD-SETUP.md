# GitHub Actions CI/CD - Configuração

## ✅ Workflow Atual

O workflow `.github/workflows/deploy.yml` está configurado para:

1. **Test** - Rodar em todo push/PR
   - Instalar dependências backend e frontend
   - Executar linters (se disponível)
   - Executar testes (se disponível)
   - Build do frontend

2. **Deploy Backend** - Apenas em push para master
   - Testes devem passar primeiro
   - Exibe instruções de deploy

3. **Deploy Frontend** - Apenas em push para master
   - Testes devem passar primeiro
   - Build do frontend
   - Exibe instruções de deploy

## 🔧 Como Configurar Deploy Automático

### Opção 1: Vercel (Frontend)

1. **Instalar Vercel CLI local:**
```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

2. **Configurar GitHub Secrets:**
- Vá em: Repositório → Settings → Secrets and variables → Actions
- Adicione:
  - `VERCEL_TOKEN` - Token da sua conta Vercel
  - `VERCEL_ORG_ID` - ID da organização
  - `VERCEL_PROJECT_ID` - ID do projeto

3. **Obter tokens Vercel:**
```bash
# Token: https://vercel.com/account/tokens
# Org ID e Project ID: vercel link (seguir prompts)
```

4. **Atualizar workflow:**
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod'
    working-directory: ./frontend
```

### Opção 2: Railway (Backend)

1. **Conectar no painel Railway:**
- Acesse [railway.app](https://railway.app)
- New Project → Deploy from GitHub repo
- Selecione `agenda-inteligente`
- Railway detecta automaticamente Node.js
- Configurar variáveis de ambiente no painel

2. **Deploy automático:**
Railway faz deploy automático em cada push para master (configurado no painel)

### Opção 3: Heroku (Backend)

1. **Instalar Heroku CLI:**
```bash
npm install -g heroku
heroku login
```

2. **Criar app:**
```bash
cd backend
heroku create agenda-api-production
```

3. **Configurar variáveis:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 64)
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set CORS_ORIGIN=https://seu-dominio.com
```

4. **Deploy manual:**
```bash
git push heroku master
```

5. **Deploy automático (opcional):**
- Conectar GitHub no painel Heroku
- Habilitar "Automatic deploys" para branch master

### Opção 4: Netlify (Frontend)

1. **Via interface web:**
- Acesse [netlify.com](https://www.netlify.com)
- New site from Git → GitHub
- Selecione repositório
- Configure:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `frontend/dist`
  - Environment variables: `VITE_API_URL=https://api.seu-dominio.com`

2. **Via CLI:**
```bash
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Opção 5: GitHub Pages (Frontend apenas estático)

1. **No repositório:**
- Settings → Pages
- Source: GitHub Actions

2. **Criar `.github/workflows/pages.yml`:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        working-directory: ./frontend
        run: |
          npm ci
          npm run build
        env:
          VITE_API_URL: https://api.seu-dominio.com
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

## 🔐 Secrets Recomendados

Configure em: Settings → Secrets and variables → Actions

### Backend
```
JWT_SECRET=<gerado com openssl rand -base64 64>
SESSION_SECRET=<gerado com openssl rand -base64 64>
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
DATABASE_URL=postgresql://user:pass@host:5432/db (se usar PostgreSQL)
```

### Frontend
```
VITE_API_URL=https://api.seu-dominio.com
```

### Deploy Services (opcional)
```
VERCEL_TOKEN=<token da Vercel>
VERCEL_ORG_ID=<org id>
VERCEL_PROJECT_ID=<project id>
RAILWAY_TOKEN=<token da Railway>
HEROKU_API_KEY=<api key da Heroku>
```

## 🚀 Workflow Atual (Simplificado)

O workflow atual não faz deploy automático, apenas:
1. Roda testes em todo push/PR
2. Faz build do frontend
3. Exibe instruções de deploy

**Por que assim?**
- Mais controle sobre deploys
- Evita custos inesperados
- Permite review manual antes de produção

**Para ativar deploy automático:**
- Configure secrets necessários
- Descomente seções de deploy no `deploy.yml`
- Ou use integrações nativas das plataformas

## 📋 Comandos Úteis

### Testar workflow localmente
```bash
# Instalar act (simula GitHub Actions)
# https://github.com/nektos/act
act push
```

### Verificar sintaxe YAML
```bash
# VS Code extension: YAML
# Ou online: https://www.yamllint.com/
```

### Debug workflow
- Ver logs no GitHub: Actions → Workflow run
- Adicionar `- run: env` para ver variáveis
- Adicionar `- run: ls -la` para ver arquivos

## ✅ Status Atual

- ✅ Workflow configurado e funcionando
- ✅ Testes automáticos em push/PR
- ✅ Build do frontend validado
- ⚠️ Deploy manual (por design)

Para deploy automático, escolha uma opção acima e configure os secrets necessários.

---

**Última atualização:** 07/12/2025
