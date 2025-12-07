# 🚀 Guia Rápido - Iniciar Sistema

## ✅ OPÇÃO 1: Usar SQLite3 (Recomendado para Testes)

O sistema já está configurado para usar SQLite3 automaticamente!

```powershell
# 1. Iniciar Backend
cd backend
npm start

# 2. Iniciar Frontend (em outro terminal)
cd frontend
npm run dev
```

**✅ Pronto!** Acesse: http://localhost:5173/admin/dashboard

---

## 🐳 OPÇÃO 2: Usar MongoDB com Docker

### Passo 1: Iniciar Docker Desktop
- Clique no ícone do Docker Desktop na barra de tarefas
- Aguarde até aparecer "Docker Desktop is running"

### Passo 2: Iniciar MongoDB
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Passo 3: Iniciar Sistema
```powershell
.\iniciar-sistema.ps1
```

---

## 📦 OPÇÃO 3: MongoDB Local (Instalação Manual)

### Download MongoDB Community
1. Acesse: https://www.mongodb.com/try/download/community
2. Selecione: Windows / MSI
3. Execute o instalador
4. Marque "Install MongoDB as a Service"

### Após Instalação
```powershell
# Iniciar serviço
Start-Service MongoDB

# Verificar
Get-Service MongoDB
```

---

## 🎯 Status Atual

✅ Backend configurado  
✅ Frontend configurado  
✅ SQLite3 funcionando  
⚠️ MongoDB opcional (para produção)

**O sistema funciona perfeitamente com SQLite3!**

---

## 🔗 URLs Importantes

- **Frontend**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin/dashboard
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **MongoDB** (se instalado): mongodb://localhost:27017

---

## 📝 Comandos Úteis

```powershell
# Parar todos os processos Node
Stop-Process -Name node -Force

# Verificar portas em uso
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Ver containers Docker
docker ps

# Parar MongoDB Docker
docker stop mongodb
docker rm mongodb

# Logs do MongoDB Docker
docker logs mongodb
```

---

## ⚡ Início Rápido (Recomendado)

Execute apenas isto:

```powershell
cd 'C:\Users\gilmar dutra\Documents\agenda inteligente'

# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

✅ **Sistema funcionando com SQLite3!**  
📊 **Dados salvos em**: `backend/data/agenda.db`
