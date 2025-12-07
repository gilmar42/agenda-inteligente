# Agenda Inteligente - Production Configuration

## ✅ Arquivos de Configuração Criados

### 1. Ambiente e Segurança
- ✅ `.gitignore` - Ignora arquivos sensíveis e temporários
- ✅ `backend/.env.example` - Template de variáveis de ambiente
- ✅ `backend/ecosystem.config.js` - Configuração PM2 para produção

### 2. Docker
- ✅ `docker-compose.yml` - Orquestração completa (MongoDB, Redis, Backend, Frontend)
- ✅ `backend/Dockerfile` - Container otimizado do backend
- ✅ `frontend/Dockerfile` - Container otimizado do frontend
- ✅ `frontend/nginx.conf` - Configuração Nginx para servir frontend

### 3. CI/CD
- ✅ `.github/workflows/deploy.yml` - Pipeline automático de deploy

### 4. Documentação
- ✅ `DEPLOYMENT.md` - Guia completo de deploy

## 🚀 Próximos Passos

### 1. Configure Variáveis de Ambiente

```bash
cd backend
cp .env.example .env
# Edite .env com suas configurações reais
```

**Variáveis críticas:**
```env
JWT_SECRET=cole-aqui-resultado-de-openssl-rand-base64-64
SESSION_SECRET=outra-chave-diferente-aqui
MONGODB_URI=sua-connection-string-do-mongodb
CORS_ORIGIN=https://seu-dominio.com
```

### 2. Gerar Secrets Seguros

```bash
# JWT Secret
openssl rand -base64 64

# Session Secret
openssl rand -base64 64
```

### 3. Escolha seu Método de Deploy

#### Opção A: Docker (Mais Rápido)
```bash
# Configurar variáveis
cp .env.example .env
# Edite .env com suas configs

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f
```

#### Opção B: Heroku
```bash
cd backend
heroku create nome-do-app
heroku config:set JWT_SECRET=sua-chave
heroku config:set MONGODB_URI=sua-uri
git push heroku master
```

#### Opção C: VPS (Ubuntu/Debian)
```bash
# Seguir guia completo em DEPLOYMENT.md
# Resumo:
1. Instalar Node.js, MongoDB, PM2, Nginx
2. Clonar repositório
3. Configurar .env
4. pm2 start ecosystem.config.js
5. Configurar Nginx como proxy
6. Instalar SSL com Let's Encrypt
```

#### Opção D: Serviços Separados
- **Backend**: Railway, Render, Fly.io
- **Frontend**: Vercel, Netlify
- **Banco**: MongoDB Atlas (gratuito)

### 4. Frontend - Configure API URL

```bash
cd frontend
echo "VITE_API_URL=https://sua-api.com" > .env
npm run build
```

### 5. Teste Localmente com Docker

```bash
# Build e iniciar
docker-compose up --build

# Testar
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
# Redis: localhost:6379
```

## 🔐 Checklist de Segurança

- [ ] Gerar novos JWT_SECRET e SESSION_SECRET
- [ ] Configurar CORS_ORIGIN com domínio real
- [ ] Usar HTTPS em produção
- [ ] Configurar whitelist de IPs no MongoDB Atlas
- [ ] Ativar rate limiting
- [ ] Revisar variáveis de ambiente
- [ ] Não commitar arquivos .env
- [ ] Usar usuário não-root nos containers
- [ ] Configurar firewall no servidor
- [ ] Implementar backup automático do banco

## 📊 Monitoramento

### Com PM2
```bash
pm2 status
pm2 monit
pm2 logs agenda-backend
```

### Com Docker
```bash
docker-compose ps
docker-compose logs -f backend
docker stats
```

## 🔄 Deploy Contínuo (CI/CD)

O workflow do GitHub Actions (`.github/workflows/deploy.yml`) já está configurado para:
1. Rodar testes no push/PR
2. Build do frontend
3. Deploy automático no Railway (backend)
4. Deploy automático no Vercel (frontend)

**Configure os secrets no GitHub:**
- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_URL`

## 📝 Comandos Úteis

### Docker
```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Rebuild
docker-compose up --build

# Logs
docker-compose logs -f backend

# Shell no container
docker-compose exec backend sh
```

### PM2
```bash
# Iniciar
pm2 start ecosystem.config.js

# Parar
pm2 stop agenda-backend

# Reiniciar
pm2 restart agenda-backend

# Monitorar
pm2 monit

# Logs
pm2 logs agenda-backend
```

### MongoDB
```bash
# Backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/agenda-inteligente"

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/agenda-inteligente" dump/
```

## 🆘 Troubleshooting

### Backend não conecta no MongoDB
- Verificar MONGODB_URI
- Verificar whitelist de IPs no Atlas
- Testar conexão: `mongosh "mongodb+srv://..."`

### Frontend não conecta na API
- Verificar VITE_API_URL no build
- Verificar CORS_ORIGIN no backend
- Verificar se backend está rodando

### Docker compose falha
- Verificar portas disponíveis (3000, 5000, 27017)
- Verificar logs: `docker-compose logs`
- Rebuild: `docker-compose up --build --force-recreate`

## 📞 Suporte

Para mais detalhes, consulte:
- `DEPLOYMENT.md` - Guia completo de deploy
- `README.md` - Documentação geral
- Issues do GitHub

---

**Status**: ✅ Pronto para deploy em produção
**Última atualização**: Dezembro 2025
