# 🚀 Configuração do Render para DARK-FB

## 📋 Visão Geral

Este guia explica como configurar o **DARK-FB** no **Render** com todas as funcionalidades profissionais:
- ✅ Backend API com Node.js
- ✅ Frontend Dashboard com React
- ✅ MongoDB para banco de dados
- ✅ Anti-ban protection
- ✅ Multi-provider authentication (Google, Facebook, GitHub)

---

## 🛠️ Pré-requisitos

1. **Conta no Render**: [https://render.com/](https://render.com/)
2. **Repositório no GitHub**: [https://github.com/onlynewsao-cmyk/DARK-FB](https://github.com/onlynewsao-cmyk/DARK-FB)
3. **Conta no MongoDB Atlas**: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
4. **Aplicativo no Facebook Developers**: [https://developers.facebook.com/](https://developers.facebook.com/)
5. **Aplicativos OAuth** (opcional para multi-auth):
   - Google Cloud Console: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - GitHub OAuth: [https://github.com/settings/developers](https://github.com/settings/developers)

---

## 📦 Estrutura do Projeto

```
DARK-FB/
├── backend/              # API Backend (Node.js + Express)
├── frontend/             # Dashboard (React.js)
├── render.yaml           # Configuração do Render
├── docs/                 # Documentação
└── scripts/              # Scripts de automação
```

---

## 🚀 Passo a Passo para Deploy

### Passo 1: Clone o Repositório

```bash
# Clone o repositório
git clone https://github.com/onlynewsao-cmyk/DARK-FB.git
cd DARK-FB

# Instale dependências (opcional, o Render fará isso)
npm run install:all
```

### Passo 2: Crie um Repositório no GitHub (Se ainda não fez)

Se você ainda não tem o código no GitHub:

```bash
# Inicialize o repositório
git init
git add .
git commit -m "Initial commit - DARK-FB"

# Adicione o remote
git remote add origin https://github.com/onlynewsao-cmyk/DARK-FB.git

# Envie para o GitHub
git push -u origin main
```

### Passo 3: Configure o MongoDB Atlas

1. **Acesse**: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Crie um cluster gratuito** (M0)
3. **Configure rede**:
   - Adicione seu IP: `0.0.0.0/0` (para permitir todas as conexões)
4. **Crie um usuário**:
   - Username: `darkFbUser`
   - Password: (escolha uma senha forte)
5. **Obtenha a URI de conexão**:
   - Clique em "Connect" > "Connect your application"
   - Copie a connection string (ex: `mongodb+srv://darkFbUser:password@cluster0.mongodb.net/dark-fb`)

### Passo 4: Configure o Facebook App

1. **Acesse**: [https://developers.facebook.com/](https://developers.facebook.com/)
2. **Crie um novo App**:
   - Tipo: "None" ou "Business"
   - Nome: "DARK-FB"
3. **Adicione produtos**:
   - Facebook Login
   - Pages
   - Groups
   - Messenger
4. **Configure permissões**:
   - `email`
   - `public_profile`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_messaging`
   - `groups_access_member_info`
   - `publish_to_groups`
5. **Obtenha credenciais**:
   - App ID
   - App Secret
6. **Gere Access Token**:
   - Vá em "Tools" > "Graph API Explorer"
   - Selecione seu app
   - Clique em "Get Token" > "Get User Access Token"
   - Selecione as permissões necessárias
   - Gere o token
   - Para token de longa duração (60 dias):
     ```bash
     curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
     ```

### Passo 5: Configure OAuth Providers (Opcional)

#### Google OAuth
1. **Acesse**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. **Crie um novo projeto**: "DARK-FB"
3. **Ative API**: Google+ API
4. **Configure OAuth**:
   - Authorized JavaScript origins: `https://dark-fb-dashboard.onrender.com`
   - Authorized redirect URIs: `https://dark-fb-api.onrender.com/api/auth/google/callback`
5. **Obtenha credenciais**:
   - Client ID
   - Client Secret

#### GitHub OAuth
1. **Acesse**: [https://github.com/settings/developers](https://github.com/settings/developers)
2. **New OAuth App**:
   - Application name: "DARK-FB"
   - Homepage URL: `https://dark-fb-dashboard.onrender.com`
   - Authorization callback URL: `https://dark-fb-api.onrender.com/api/auth/github/callback`
3. **Obtenha credenciais**:
   - Client ID
   - Client Secret

---

## 🌐 Deploy no Render

### Método 1: Usando render.yaml (Recomendado)

1. **Acesse**: [https://dashboard.render.com/](https://dashboard.render.com/)
2. **Clique em "New" > "From render.yaml"**
3. **Cole o conteúdo do arquivo `render.yaml`** ou faça upload
4. **Clique em "Apply"**
5. **Aguarde o deploy**

### Método 2: Configuração Manual

#### 1. Deploy do Backend (dark-fb-api)

1. **Clique em "New" > "Web Service"**
2. **Configure**:
   - **Name**: `dark-fb-api`
   - **Type**: `Node`
   - **Region**: `Oregon (us-west-2)` (ou mais próximo de você)
   - **Plan**: `Free`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: ✅ `Yes`

3. **Adicione Variáveis de Ambiente**:

   | Key | Value | Sync | Description |
   |-----|-------|------|-------------|
   | NODE_ENV | production | ✅ | Ambiente |
   | PORT | 10000 | ✅ | Porta do servidor |
   | MONGODB_URI | (do MongoDB Atlas) | ❌ | URI do MongoDB |
   | JWT_SECRET | (gerar uma chave) | ❌ | Chave JWT |
   | JWT_EXPIRES_IN | 30d | ✅ | Expiração do token |
   | FACEBOOK_APP_ID | (seu App ID) | ❌ | Facebook App ID |
   | FACEBOOK_APP_SECRET | (seu App Secret) | ❌ | Facebook App Secret |
   | FACEBOOK_ACCESS_TOKEN | (token de longa duração) | ❌ | Facebook Access Token |
   | FACEBOOK_WEBHOOK_VERIFY_TOKEN | (gerar uma chave) | ❌ | Webhook Verify Token |
   | GOOGLE_CLIENT_ID | (opcional) | ❌ | Google OAuth Client ID |
   | GOOGLE_CLIENT_SECRET | (opcional) | ❌ | Google OAuth Client Secret |
   | GITHUB_CLIENT_ID | (opcional) | ❌ | GitHub OAuth Client ID |
   | GITHUB_CLIENT_SECRET | (opcional) | ❌ | GitHub OAuth Client Secret |
   | SESSION_SECRET | (gerar uma chave) | ❌ | Session Secret |
   | FRONTEND_URL | https://dark-fb-dashboard.onrender.com | ✅ | URL do Frontend |
   | RENDER_URL | https://dark-fb-api.onrender.com | ✅ | URL da API |
   | CORS_ORIGIN | https://dark-fb-dashboard.onrender.com | ✅ | CORS Origin |
   | CORS_METHODS | GET,POST,PUT,DELETE,PATCH,OPTIONS | ✅ | Métodos CORS |
   | CORS_CREDENTIALS | true | ✅ | CORS Credentials |
   | RATE_LIMIT_ENABLED | true | ✅ | Rate Limiting |
   | ANTI_BAN_ENABLED | true | ✅ | Anti-Ban |
   | MAX_POSTS_PER_HOUR | 50 | ✅ | Max Posts/Hour |
   | MAX_MESSAGES_PER_MINUTE | 20 | ✅ | Max Messages/Minute |
   | MULTI_PROVIDER_AUTH | true | ✅ | Multi-Provider Auth |
   | REALTIME_NOTIFICATIONS | true | ✅ | Real-time |
   | ANALYTICS_ENABLED | true | ✅ | Analytics |
   | SCHEDULED_POSTS | true | ✅ | Scheduled Posts |

4. **Clique em "Create Web Service"**

#### 2. Deploy do Frontend (dark-fb-dashboard)

1. **Clique em "New" > "Static Site"**
2. **Configure**:
   - **Name**: `dark-fb-dashboard`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Auto-Deploy**: ✅ `Yes`

3. **Adicione Variáveis de Ambiente**:

   | Key | Value | Sync | Description |
   |-----|-------|------|-------------|
   | REACT_APP_API_URL | https://dark-fb-api.onrender.com/api | ✅ | API URL |
   | REACT_APP_SOCKET_URL | https://dark-fb-api.onrender.com | ✅ | Socket URL |
   | REACT_APP_GOOGLE_CLIENT_ID | (mesmo do backend) | ❌ | Google Client ID |
   | REACT_APP_FACEBOOK_APP_ID | (mesmo do backend) | ❌ | Facebook App ID |
   | REACT_APP_GITHUB_CLIENT_ID | (mesmo do backend) | ❌ | GitHub Client ID |

4. **Clique em "Create Static Site"**

#### 3. Configure o MongoDB

1. **Clique em "New" > "Database"**
2. **Configure**:
   - **Name**: `dark-fb-mongodb`
   - **Type**: `MongoDB`
   - **Region**: `Oregon (us-west-2)` (mesma do backend)
   - **Plan**: `Free`
   - **IP Allow List**: `0.0.0.0/0` (ou adicione IPs específicos)
   - **Auto-Deploy**: ✅ `Yes`

3. **Clique em "Create Database"**
4. **Anota a URI de conexão** (ela será automaticamente injetada no backend via `fromService`)

#### 4. Configure o Scheduler (Opcional)

Para publicações agendadas funcionarem:

1. **Clique em "New" > "Cron Job"**
2. **Configure**:
   - **Name**: `dark-fb-scheduler`
   - **Type**: `Node`
   - **Region**: `Oregon (us-west-2)`
   - **Plan**: `Free`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Schedule**: `* * * * *` (a cada minuto)
   - **Start Command**: `node scripts/scheduler.js`
   - **Auto-Deploy**: ✅ `Yes`

3. **Adicione Variáveis de Ambiente**:
   - Mesmas do backend

4. **Clique em "Create Cron Job"**

---

## 🔗 Configure Webhooks do Facebook

1. **No Facebook Developers**:
   - Vá em **App Review** > **Webhooks**
2. **Adicione Callback URL**:
   - URL: `https://dark-fb-api.onrender.com/api/facebook/webhook`
   - Verify Token: (mesmo valor de `FACEBOOK_WEBHOOK_VERIFY_TOKEN` no Render)
3. **Assine eventos**:
   - messages
   - messaging_postbacks
   - messaging_optins
   - message_reads
   - feed
   - reactions
   - comments
4. **Salve**

---

## 📊 Configure Uptime Monitoring (Opcional)

1. **Crie conta**: [https://uptimerobot.com/](https://uptimerobot.com/)
2. **Adicione monitor HTTP(s)**:
   - URL: `https://dark-fb-api.onrender.com/api/health`
   - Check every: 5 minutes
   - Alert if: down for 1 minute
3. **Configure notificações**:
   - Adicione seu email para receber alertas

---

## ✅ Verifique o Deploy

Após o deploy ser concluído:

1. **Acesse o Dashboard**:
   - [https://dark-fb-dashboard.onrender.com](https://dark-fb-dashboard.onrender.com)

2. **Acesse a API Docs**:
   - [https://dark-fb-api.onrender.com/api-docs](https://dark-fb-api.onrender.com/api-docs)

3. **Verifique Health Check**:
   - [https://dark-fb-api.onrender.com/api/health](https://dark-fb-api.onrender.com/api/health)

4. **Teste o Login**:
   - Tente fazer login com email/senha
   - Teste os botões de OAuth (Google, Facebook, GitHub)

---

## 🔧 Solução de Problemas

### Problema: Backend não inicia
**Solução**:
- Verifique os logs no Render
- Verifique se o MongoDB está conectado
- Verifique se todas as variáveis de ambiente estão configuradas

### Problema: Frontend não carrega
**Solução**:
- Verifique se o backend está rodando
- Verifique o console do navegador (F12)
- Verifique se as variáveis `REACT_APP_API_URL` e `REACT_APP_SOCKET_URL` estão corretas

### Problema: OAuth não funciona
**Solução**:
- Verifique se os Client IDs e Secrets estão corretos
- Verifique se as URLs de callback estão corretas
- Verifique se os domínios estão autorizados nos provedores OAuth

### Problema: Publicações agendadas não são publicadas
**Solução**:
- Verifique se o Cron Job está rodando
- Verifique os logs do scheduler
- Verifique se o Access Token não expirou

### Problema: Webhook não recebe eventos
**Solução**:
- Verifique se o Verify Token está correto
- Verifique se a URL do webhook está acessível
- Teste o endpoint: `https://dark-fb-api.onrender.com/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test`

---

## 📈 Otimização de Performance

### 1. Ative HTTPS
O Render automaticamente configura HTTPS para todos os serviços.

### 2. Configure CDN
Para o frontend estático, o Render já usa CDN.

### 3. Ajuste Rate Limiting
Ajuste as variáveis de rate limiting conforme necessário:
- `MAX_POSTS_PER_HOUR`: 50 (recomendado)
- `MAX_MESSAGES_PER_MINUTE`: 20 (recomendado)

### 4. Configure Proxy Rotation (Avançado)
Para evitar banimento:
1. Configure `PROXY_ENABLED=true`
2. Adicione proxies em `PROXIES` (separados por vírgula)
3. Exemplo: `PROXIES=http://proxy1:8080,http://proxy2:8080`

---

## 🔒 Segurança

### 1. Proteja suas Chaves
- Nunca compartilhe Client IDs e Secrets
- Use variáveis de ambiente
- Revogue tokens expirados

### 2. Configure CORS
- Restrinja `CORS_ORIGIN` para seus domínios
- Exemplo: `https://dark-fb-dashboard.onrender.com,https://seu-dominio.com`

### 3. Ative Rate Limiting
- Mantenha `RATE_LIMIT_ENABLED=true`
- Ajuste limites conforme necessário

### 4. Use Tokens de Longa Duração
- Facebook tokens: 60 dias
- JWT tokens: 30 dias (configurável)

---

## 📞 Suporte

- **GitHub Issues**: [https://github.com/onlynewsao-cmyk/DARK-FB/issues](https://github.com/onlynewsao-cmyk/DARK-FB/issues)
- **Render Support**: [https://render.com/support](https://render.com/support)
- **MongoDB Support**: [https://support.mongodb.com/](https://support.mongodb.com/)
- **Facebook Developers**: [https://developers.facebook.com/support/](https://developers.facebook.com/support/)

---

## 🎯 Checklist de Deploy

- [ ] Repositório no GitHub
- [ ] MongoDB Atlas configurado
- [ ] Facebook App configurado
- [ ] OAuth Providers configurados (opcional)
- [ ] Backend deployado no Render
- [ ] Frontend deployado no Render
- [ ] MongoDB configurado no Render
- [ ] Scheduler configurado (opcional)
- [ ] Webhooks do Facebook configurados
- [ ] Uptime Monitoring configurado (opcional)
- [ ] Testes realizados

---

## 🏆 Pronto!

Seu **DARK-FB** está agora rodando no Render com:
- ✅ Backend API profissional
- ✅ Frontend Dashboard moderno
- ✅ Autenticação multi-provedor
- ✅ Anti-ban protection
- ✅ Agendamento de publicações
- ✅ Analytics completo
- ✅ Notificações em tempo real

**Acesse agora**: [https://dark-fb-dashboard.onrender.com](https://dark-fb-dashboard.onrender.com)

---

> **Nota**: Este guia assume que você já tem o código no GitHub. Se não, siga o Passo 2 acima.

> **Dica**: O Render tem um plano gratuito que é suficiente para desenvolvimento e testes. Para produção com alto tráfego, considere atualizar para um plano pago.
