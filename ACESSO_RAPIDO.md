# 🚀 Acesso Rápido - Facebook Bot

## 📦 Projeto Criado

✅ **Facebook Bot - Sistema Completo de Automação**

**Localização**: `/home/user/facebook-bot/`

---

## 📁 Estrutura do Projeto

```
facebook-bot/
├── backend/           # API Backend (Node.js + Express)
├── frontend/          # Dashboard (React.js)
├── scripts/           # Scripts de automação
├── render.yaml        # Configuração para Render
├── README.md          # Documentação completa
├── INSTRUCOES.md      # Instruções detalhadas
├── GITHUB_SETUP.md    # Configuração GitHub
├── PROJETO_COMPLETO.md # Detalhes do projeto
└── ACESSO_RAPIDO.md    # Este arquivo
```

---

## 🏃‍♂️ Passos para Começar

### 1. Instalar Dependências

```bash
# No diretório raiz do projeto
cd /home/user/facebook-bot

# Instalar todas as dependências (backend + frontend)
npm run install:all
```

### 2. Configurar Variáveis de Ambiente

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/facebook-bot
JWT_SECRET=sua_chave_secreta
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
FACEBOOK_ACCESS_TOKEN=seu_access_token
FACEBOOK_WEBHOOK_VERIFY_TOKEN=sua_chave_webhook
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Iniciar o Sistema

```bash
# Iniciar backend e frontend simultaneamente
npm run dev
```

Ou separadamente:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

---

## 🌐 URLs de Acesso

### Desenvolvimento Local
- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Docs (Swagger)**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Produção (após deploy no Render)
- **Dashboard**: https://facebook-bot-dashboard.onrender.com
- **API**: https://facebook-bot-api.onrender.com/api
- **API Docs**: https://facebook-bot-api.onrender.com/api-docs

---

## 📚 Documentação

| Arquivo | Descrição |
|--------|------------|
| `README.md` | Documentação principal |
| `INSTRUCOES.md` | Instruções detalhadas de configuração |
| `GITHUB_SETUP.md` | Como configurar o GitHub |
| `PROJETO_COMPLETO.md` | Detalhes técnicos completos |
| `render.yaml` | Configuração para deploy no Render |

---

## 🛠️ Configurações Necessárias

### 1. MongoDB
- [ ] Criar conta no MongoDB Atlas
- [ ] Criar cluster gratuito
- [ ] Obter URI de conexão
- [ ] Configurar em `backend/.env`

**Link**: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)

### 2. Facebook Developer
- [ ] Criar app no Facebook
- [ ] Adicionar produtos (Login, Pages, Groups, Messenger)
- [ ] Configurar permissões
- [ ] Gerar Access Token
- [ ] Configurar em `backend/.env`

**Link**: [https://developers.facebook.com/](https://developers.facebook.com/)

### 3. GitHub
- [ ] Revogar token antigo (exposto!)
- [ ] Gerar novo token
- [ ] Criar repositório
- [ ] Enviar código

**Link**: [https://github.com/](https://github.com/)

### 4. Render (Deploy)
- [ ] Criar conta
- [ ] Configurar MongoDB
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configurar scheduler (opcional)

**Link**: [https://render.com/](https://render.com/)

### 5. UptimeRobot (Monitoramento)
- [ ] Criar conta
- [ ] Adicionar monitor
- [ ] Configurar alertas

**Link**: [https://uptimerobot.com/](https://uptimerobot.com/)

---

## 🎯 Funcionalidades Principais

### ✅ Autenticação
- Registro de usuários
- Login/Logout
- Recuperação de senha
- Tokens JWT

### ✅ Facebook Integration
- Conectar páginas
- Conectar grupos
- Publicar posts
- Upload de mídia
- Receber mensagens
- Webhooks

### ✅ Publicações
- Criar/Editar/Deletar
- Publicar agora
- Agendar
- Recorrência (diária, semanal, mensal)
- Estatísticas

### ✅ Mensagens
- Listar mensagens
- Ver conversas
- Responder
- Marcar como lida
- Arquivar
- Notificações em tempo real

### ✅ Analytics
- Dashboard
- Gráficos
- Relatórios
- Exportar CSV

---

## 📞 Comandos Úteis

| Comando | Descrição |
|---------|------------|
| `npm run install:all` | Instalar todas as dependências |
| `npm run dev` | Iniciar backend + frontend |
| `npm run start:backend` | Iniciar apenas backend |
| `npm run start:frontend` | Iniciar apenas frontend |
| `npm run build` | Build para produção |
| `npm test` | Executar testes |
| `npm run lint` | Verificar linting |

---

## 🔐 Credenciais Importantes

### ⚠️ TOKEN GITHUB EXPOSTO!

O token `ghp_REMOVIDO_POR_SEGURANCA` foi encontrado no arquivo `text.txt` e **DEVE SER REVOGADO IMEDIATAMENTE**!

**Ação urgente**:
1. Acesse: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Localize e revogue este token
3. Gere um novo token
4. Use o novo token para configurações

---

## 💡 Dicas

### 1. Primeiros Passos
1. Configure o MongoDB
2. Configure o Facebook App
3. Instale as dependências
4. Inicie o sistema localmente
5. Teste todas as funcionalidades

### 2. Deploy
1. Faça o push para o GitHub
2. Configure o Render
3. Deploy backend e frontend
4. Configure webhooks
5. Teste em produção

### 3. Manutenção
- Monitore os logs
- Atualize dependências regularmente
- Renove tokens expirados
- Faça backup do banco de dados

---

## 📊 Status do Projeto

| Item | Status |
|------|--------|
| Backend | ✅ Completo |
| Frontend | ✅ Completo |
| API Documentation | ✅ Completo |
| MongoDB Integration | ✅ Completo |
| Facebook Integration | ✅ Completo |
| Authentication | ✅ Completo |
| Scheduling | ✅ Completo |
| Messaging | ✅ Completo |
| Analytics | ✅ Completo |
| Real-time Updates | ✅ Completo |
| Deploy Configuration | ✅ Completo |

---

## 🎉 Próximos Passos

1. **Revogue o token GitHub exposto** ⚠️
2. **Configure o MongoDB**
3. **Configure o Facebook App**
4. **Instale as dependências**
5. **Inicie o sistema localmente**
6. **Teste todas as funcionalidades**
7. **Faça o deploy no Render**
8. **Configure o monitoramento**

---

## 📞 Suporte

- **Documentação**: [README.md](README.md)
- **Instruções**: [INSTRUCOES.md](INSTRUCOES.md)
- **GitHub**: [https://github.com/onlynewsao-cmyk](https://github.com/onlynewsao-cmyk)

---

## 🏆 Projeto Concluído!

✅ **Facebook Bot está pronto para uso!**

O projeto foi criado com todas as funcionalidades solicitadas:
- ✅ Bot para Facebook
- ✅ Postar em páginas, grupos, canais
- ✅ Responder mensagens
- ✅ GitHub integration
- ✅ Render deploy configuration
- ✅ Uptime monitoring
- ✅ MongoDB
- ✅ Dashboard completo

**Pasta do projeto**: `/home/user/facebook-bot/`

---

> **Nota**: Este projeto foi criado com ❤️ para o usuário **onlynewsao-cmyk** em **Viana, Luanda, Angola**.

**Data**: 26 de Agosto de 2026
