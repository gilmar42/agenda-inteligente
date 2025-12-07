# Agenda Inteligente - Backend Setup

## Instalação do MongoDB (Para Produção)

### Windows - MongoDB Community Edition

1. **Download MongoDB Community Edition**
   - Acesse: https://www.mongodb.com/try/download/community
   - Selecione Windows
   - Download o arquivo `.msi`

2. **Instalação**
   - Execute o instalador
   - Selecione "Custom" durante a instalação
   - Marque "Install MongoDB as a Service"
   - Marque "Run MongoDB as a Service"

3. **Verificar Instalação**
   ```powershell
   mongod --version
   ```

4. **Iniciar MongoDB Service**
   ```powershell
   # Windows PowerShell (como Admin)
   Start-Service MongoDB
   
   # Verificar status
   Get-Service MongoDB
   ```

5. **Conectar ao MongoDB**
   ```powershell
   mongosh
   ```

## Setup Rápido (Desenvolvimento com SQLite3)

Se você não quer instalar MongoDB agora, o sistema já usa **SQLite3 como fallback**.

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Iniciar servidor**
   ```bash
   npm start
   ```

O servidor iniciará com SQLite3 para desenvolvimento e dados serão armazenados em `./data/agenda.db`.

## Variáveis de Ambiente (.env)

```env
NODE_ENV=development
PORT=3001
MONGO_URL=mongodb://localhost:27017/agenda_inteligente
JWT_SECRET=dev-secret-key-change-in-production
GOOGLE_CLIENT_ID=seu-client-id-aqui
```

## Estrutura de Dados

### MongoDB (Produção)
- **Users**: Usuários do sistema
- **Appointments**: Agendamentos
- **FeeLedgers**: Histórico de pagamentos

### SQLite3 (Desenvolvimento)
Mesmas tabelas, armazenadas localmente em `./data/agenda.db`

## Testes da API

```bash
# Health check
curl http://localhost:3001/health

# Signup
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### MongoDB Connection Error
Se receber erro de conexão MongoDB:
- Verifique se MongoDB está rodando: `Get-Service MongoDB`
- Inicie o serviço: `Start-Service MongoDB`
- Sistema usa SQLite3 automaticamente se MongoDB não estiver disponível

### Portas em Uso
- Backend: 3001
- Frontend: 5173
- MongoDB: 27017 (padrão)

## Estrutura do Projeto

```
backend/
├── src/
│   ├── server.js          # Express server principal
│   ├── db.js              # Camada de abstração SQLite3
│   └── routes/
│       └── adminRouter.js # Rotas administrativas
├── data/
│   └── agenda.db          # Banco SQLite3 (criado automaticamente)
├── .env                   # Variáveis de ambiente
├── package.json
└── .gitignore
```
