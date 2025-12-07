# Deployment Guide - Agenda Inteligente

## 📦 Preparação para Deploy

### 1. Checklist Pré-Deploy

- [ ] Testar toda aplicação localmente
- [ ] Configurar variáveis de ambiente de produção
- [ ] Build frontend e backend sem erros
- [ ] Testar conexão com banco de dados de produção
- [ ] Configurar domínio e DNS
- [ ] Configurar SSL/TLS
- [ ] Revisar segurança (secrets, CORS, rate limits)

---

## 🚀 Deploy - Backend (Node.js + Express)

### Opção 1: Heroku

1. **Instalar Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Criar aplicação**
```bash
cd backend
heroku create agenda-inteligente-api
```

3. **Configurar variáveis de ambiente**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=sua-chave-super-secreta
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
heroku config:set CORS_ORIGIN=https://seu-dominio.com
```

4. **Deploy**
```bash
git push heroku master
heroku logs --tail
```

### Opção 2: Railway

1. **Acessar [railway.app](https://railway.app)**
2. Conectar repositório GitHub
3. Selecionar branch `master`
4. Configurar variáveis de ambiente no painel
5. Deploy automático em cada push

### Opção 3: VPS (Ubuntu/Debian)

1. **Preparar servidor**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MongoDB (se necessário)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Instalar PM2
sudo npm install -g pm2
```

2. **Clonar e configurar**
```bash
cd /var/www
sudo git clone https://github.com/gilmar42/agenda-inteligente.git
cd agenda-inteligente/backend
sudo npm install --production

# Criar arquivo .env
sudo nano .env
# Cole as configurações de produção
```

3. **Iniciar com PM2**
```bash
pm2 start server.js --name agenda-backend
pm2 save
pm2 startup
```

4. **Configurar Nginx como proxy reverso**
```bash
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/agenda-api
```

Conteúdo do arquivo:
```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/agenda-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Configurar SSL com Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.seu-dominio.com
sudo systemctl restart nginx
```

---

## 🎨 Deploy - Frontend (React + Vite)

### Opção 1: Vercel (Recomendado)

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel login
vercel --prod
```

Ou conectar repositório no painel da Vercel.

### Opção 2: Netlify

1. **Instalar Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build e Deploy**
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Opção 3: VPS (mesmo servidor do backend)

1. **Build do frontend**
```bash
cd /var/www/agenda-inteligente/frontend
sudo npm install
sudo npm run build
```

2. **Configurar Nginx para servir frontend**
```bash
sudo nano /etc/nginx/sites-available/agenda-frontend
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    root /var/www/agenda-inteligente/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agenda-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## 🗄️ Deploy - Banco de Dados

### MongoDB Atlas (Recomendado para produção)

1. Criar conta em [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Criar cluster gratuito (M0)
3. Configurar IP whitelist (0.0.0.0/0 ou IPs específicos)
4. Criar usuário e senha
5. Obter connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/agenda-inteligente?retryWrites=true&w=majority
```
6. Usar esta string na variável `MONGODB_URI`

### MongoDB Auto-hospedado

```bash
# Ubuntu/Debian
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Criar usuário admin
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "senha-super-segura",
  roles: ["root"]
})
use agenda-inteligente
db.createUser({
  user: "appuser",
  pwd: "senha-app",
  roles: ["readWrite"]
})
```

---

## 🔐 Configurações de Segurança

### 1. Variáveis de Ambiente Obrigatórias

```env
# Backend .env
NODE_ENV=production
PORT=5000
JWT_SECRET=chave-gerada-com-openssl-rand-base64-64
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://seu-dominio.com
SESSION_SECRET=outra-chave-super-secreta
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Gerar secrets seguros

```bash
# Gerar JWT secret
openssl rand -base64 64

# Ou com Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 3. Configurar CORS corretamente

Em `backend/server.js`:
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 4. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de requisições
  message: 'Muitas requisições deste IP'
});

app.use('/api/', limiter);
```

---

## 📊 Monitoramento

### 1. PM2 Monit (VPS)

```bash
# Ver status
pm2 status

# Monitoramento em tempo real
pm2 monit

# Logs
pm2 logs agenda-backend

# Recarregar após mudanças
pm2 reload agenda-backend
```

### 2. Configurar logging

```javascript
// backend/server.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 🔄 CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

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
    
    - name: Install Backend Dependencies
      run: |
        cd backend
        npm ci
    
    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Build Frontend
      run: |
        cd frontend
        npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: ./frontend
```

---

## 📝 Checklist Final

- [ ] Backend rodando em produção
- [ ] Frontend acessível pelo domínio
- [ ] Banco de dados conectado
- [ ] SSL/HTTPS configurado
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logs funcionando
- [ ] Backup automático do banco
- [ ] Monitoramento ativo
- [ ] Documentação da API atualizada
- [ ] Testes passando

---

## 🆘 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
pm2 logs agenda-backend

# Verificar variáveis
pm2 env 0

# Reiniciar
pm2 restart agenda-backend
```

### Erro de CORS
- Verificar `CORS_ORIGIN` no backend
- Confirmar protocolo (http vs https)
- Verificar se frontend está fazendo requisições para URL correta

### Banco não conecta
- Verificar whitelist de IPs no MongoDB Atlas
- Testar connection string com `mongosh`
- Verificar se MongoDB está rodando (VPS)

### SSL não funciona
```bash
# Renovar certificado
sudo certbot renew
sudo systemctl restart nginx
```

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs com `pm2 logs` ou no painel do serviço
2. Consultar documentação específica da plataforma
3. Abrir issue no GitHub

---

**Última atualização**: Dezembro 2025
