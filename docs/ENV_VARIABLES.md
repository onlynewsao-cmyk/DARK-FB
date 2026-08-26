# 🔐 Variáveis de Ambiente - DARK-FB

## 📋 Visão Geral

O **DARK-FB** usa variáveis de ambiente para configuração. Este documento explica todas as variáveis necessárias para o funcionamento completo do sistema.

---

## 📁 Arquivos de Configuração

| Arquivo | Localização | Descrição |
|---------|-------------|------------|
| `.env` | `backend/` | Variáveis do Backend |
| `.env` | `frontend/` | Variáveis do Frontend |
| `.env.example` | `backend/` | Exemplo de variáveis do Backend |
| `.env.example` | `frontend/` | Exemplo de variáveis do Frontend |

---

## 🏗️ Variáveis do Backend

### 🔹 Configuração do Servidor

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `PORT` | number | ✅ | 5000 | Porta do servidor |
| `NODE_ENV` | string | ✅ | development | Ambiente (development, production) |

**Exemplo:**
```env
PORT=10000
NODE_ENV=production
```

---

### 🔹 Configuração do Banco de Dados

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `MONGODB_URI` | string | ✅ | - | URI de conexão do MongoDB |
| `REDIS_URL` | string | ❌ | redis://localhost:6379 | URL do Redis para rate limiting |

**Exemplo (MongoDB Atlas):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/dark-fb?retryWrites=true&w=majority
```

**Exemplo (MongoDB Local):**
```env
MONGODB_URI=mongodb://localhost:27017/dark-fb
```

---

### 🔹 Configuração JWT

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `JWT_SECRET` | string | ✅ | - | Chave secreta para JWT |
| `JWT_EXPIRES_IN` | string | ❌ | 30d | Tempo de expiração do token |

**Exemplo:**
```env
JWT_SECRET=your_super_secure_jwt_secret_key_here_1234567890
JWT_EXPIRES_IN=30d
```

> **Dica**: Gere uma chave forte com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### 🔹 Configuração do Facebook

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `FACEBOOK_APP_ID` | string | ✅ | - | App ID do Facebook |
| `FACEBOOK_APP_SECRET` | string | ✅ | - | App Secret do Facebook |
| `FACEBOOK_ACCESS_TOKEN` | string | ✅ | - | Access Token de longa duração |
| `FACEBOOK_PAGE_ID` | string | ❌ | - | ID da página do Facebook |
| `FACEBOOK_GROUP_ID` | string | ❌ | - | ID do grupo do Facebook |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | string | ✅ | - | Token de verificação do Webhook |
| `FACEBOOK_CALLBACK_URL` | string | ❌ | /api/auth/facebook/callback | URL de callback OAuth |

**Exemplo:**
```env
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_ACCESS_TOKEN=EAAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
FACEBOOK_CALLBACK_URL=https://dark-fb-api.onrender.com/api/auth/facebook/callback
```

> **Nota**: O `FACEBOOK_ACCESS_TOKEN` deve ser um **token de longa duração** (60 dias).

---

### 🔹 Configuração OAuth (Multi-Provider Auth)

#### Google OAuth

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `GOOGLE_CLIENT_ID` | string | ❌ | - | Client ID do Google |
| `GOOGLE_CLIENT_SECRET` | string | ❌ | - | Client Secret do Google |
| `GOOGLE_CALLBACK_URL` | string | ❌ | /api/auth/google/callback | URL de callback |

**Exemplo:**
```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://dark-fb-api.onrender.com/api/auth/google/callback
```

#### GitHub OAuth

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `GITHUB_CLIENT_ID` | string | ❌ | - | Client ID do GitHub |
| `GITHUB_CLIENT_SECRET` | string | ❌ | - | Client Secret do GitHub |
| `GITHUB_CALLBACK_URL` | string | ❌ | /api/auth/github/callback | URL de callback |

**Exemplo:**
```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=https://dark-fb-api.onrender.com/api/auth/github/callback
```

---

### 🔹 Configuração de Sessão

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `SESSION_SECRET` | string | ✅ | - | Chave secreta da sessão |
| `SESSION_COOKIE_NAME` | string | ❌ | dark-fb-session | Nome do cookie de sessão |
| `SESSION_COOKIE_MAX_AGE` | number | ❌ | 86400000 | Tempo de vida do cookie (ms) |

**Exemplo:**
```env
SESSION_SECRET=your_session_secret_key_here
SESSION_COOKIE_NAME=dark-fb-session
SESSION_COOKIE_MAX_AGE=86400000
```

---

### 🔹 Configuração de Email (Opcional)

#### SMTP

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `SMTP_HOST` | string | ❌ | smtp.gmail.com | Host SMTP |
| `SMTP_PORT` | number | ❌ | 587 | Porta SMTP |
| `SMTP_SECURE` | boolean | ❌ | false | Conexão segura |
| `SMTP_USER` | string | ❌ | - | Usuário SMTP |
| `SMTP_PASSWORD` | string | ❌ | - | Senha SMTP |
| `SMTP_FROM` | string | ❌ | noreply@dark-fb.com | Email de envio |

**Exemplo (Gmail):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM=noreply@dark-fb.com
```

#### SendGrid

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `SENDGRID_API_KEY` | string | ❌ | - | API Key do SendGrid |

**Exemplo:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Mailgun

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `MAILGUN_API_KEY` | string | ❌ | - | API Key do Mailgun |
| `MAILGUN_DOMAIN` | string | ❌ | - | Domínio do Mailgun |

**Exemplo:**
```env
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain.com
```

---

### 🔹 Configuração do Frontend

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `FRONTEND_URL` | string | ✅ | http://localhost:3000 | URL do Frontend |
| `RENDER_URL` | string | ❌ | - | URL da API no Render |

**Exemplo:**
```env
FRONTEND_URL=https://dark-fb-dashboard.onrender.com
RENDER_URL=https://dark-fb-api.onrender.com
```

---

### 🔹 Configuração CORS

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `CORS_ORIGIN` | string | ❌ | http://localhost:3000 | Origens permitidas |
| `CORS_METHODS` | string | ❌ | GET,POST,PUT,DELETE,PATCH,OPTIONS | Métodos permitidos |
| `CORS_CREDENTIALS` | boolean | ❌ | true | Permitir credenciais |

**Exemplo:**
```env
CORS_ORIGIN=https://dark-fb-dashboard.onrender.com
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_CREDENTIALS=true
```

---

### 🔹 Configuração de Logging

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `LOG_LEVEL` | string | ❌ | info | Nível de logging |
| `LOG_FILES_ENABLED` | boolean | ❌ | true | Salvar logs em arquivos |

**Exemplo:**
```env
LOG_LEVEL=info
LOG_FILES_ENABLED=true
```

---

### 🔹 Configuração Anti-Ban

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `RATE_LIMIT_ENABLED` | boolean | ❌ | true | Ativar rate limiting |
| `PROXY_ENABLED` | boolean | ❌ | false | Ativar rotação de proxy |
| `PROXIES` | string | ❌ | - | Lista de proxies |
| `MAX_POSTS_PER_HOUR` | number | ❌ | 50 | Máximo de posts por hora |
| `MAX_MESSAGES_PER_MINUTE` | number | ❌ | 20 | Máximo de mensagens por minuto |
| `RANDOM_DELAY_MIN` | number | ❌ | 1000 | Delay mínimo aleatório (ms) |
| `RANDOM_DELAY_MAX` | number | ❌ | 5000 | Delay máximo aleatório (ms) |

**Exemplo:**
```env
RATE_LIMIT_ENABLED=true
PROXY_ENABLED=false
MAX_POSTS_PER_HOUR=50
MAX_MESSAGES_PER_MINUTE=20
RANDOM_DELAY_MIN=1000
RANDOM_DELAY_MAX=5000
```

**Exemplo com Proxy:**
```env
PROXY_ENABLED=true
PROXIES=http://proxy1:8080,http://proxy2:8080,socks5://proxy3:1080
```

---

### 🔹 Configuração de Feature Flags

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `MULTI_PROVIDER_AUTH` | boolean | ❌ | true | Ativar autenticação multi-provedor |
| `EMAIL_VERIFICATION` | boolean | ❌ | false | Ativar verificação de email |
| `ANTI_BAN_ENABLED` | boolean | ❌ | true | Ativar proteção anti-ban |
| `REALTIME_NOTIFICATIONS` | boolean | ❌ | true | Ativar notificações em tempo real |
| `ANALYTICS_ENABLED` | boolean | ❌ | true | Ativar analytics |
| `SCHEDULED_POSTS` | boolean | ❌ | true | Ativar publicações agendadas |

**Exemplo:**
```env
MULTI_PROVIDER_AUTH=true
EMAIL_VERIFICATION=true
ANTI_BAN_ENABLED=true
REALTIME_NOTIFICATIONS=true
ANALYTICS_ENABLED=true
SCHEDULED_POSTS=true
```

---

### 🔹 Configuração de Uptime Monitoring

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `UPTIME_ROBOT_API_KEY` | string | ❌ | - | API Key do UptimeRobot |

**Exemplo:**
```env
UPTIME_ROBOT_API_KEY=your_uptime_robot_api_key_here
```

---

### 🔹 Configuração de Analytics

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `GOOGLE_ANALYTICS_ID` | string | ❌ | - | Google Analytics ID |

**Exemplo:**
```env
GOOGLE_ANALYTICS_ID=UA-XXXXXXXX-X
```

---

### 🔹 Configuração de Pagamento (Futuro)

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `STRIPE_SECRET_KEY` | string | ❌ | - | Stripe Secret Key |
| `STRIPE_PUBLISHABLE_KEY` | string | ❌ | - | Stripe Publishable Key |
| `PAYPAL_CLIENT_ID` | string | ❌ | - | PayPal Client ID |
| `PAYPAL_CLIENT_SECRET` | string | ❌ | - | PayPal Client Secret |

---

### 🔹 Configuração de Notificações

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `FCM_SERVER_KEY` | string | ❌ | - | Firebase Cloud Messaging Key |
| `SLACK_WEBHOOK_URL` | string | ❌ | - | Slack Webhook URL |

---

## 🏗️ Variáveis do Frontend

| Variável | Tipo | Obrigatória | Valor Padrão | Descrição |
|----------|------|-------------|--------------|------------|
| `REACT_APP_API_URL` | string | ✅ | http://localhost:5000/api | URL da API |
| `REACT_APP_SOCKET_URL` | string | ✅ | http://localhost:5000 | URL do Socket.io |
| `REACT_APP_GOOGLE_CLIENT_ID` | string | ❌ | - | Google OAuth Client ID |
| `REACT_APP_FACEBOOK_APP_ID` | string | ❌ | - | Facebook App ID |
| `REACT_APP_GITHUB_CLIENT_ID` | string | ❌ | - | GitHub OAuth Client ID |

**Exemplo (Desenvolvimento):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Exemplo (Produção):**
```env
REACT_APP_API_URL=https://dark-fb-api.onrender.com/api
REACT_APP_SOCKET_URL=https://dark-fb-api.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
```

---

## 📝 Como Obter as Variáveis

### 1. MongoDB URI
1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster
3. Clique em "Connect" > "Connect your application"
4. Copie a connection string

### 2. Facebook Credentials
1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um app
3. Obtenha App ID e App Secret
4. Gere um Access Token de longa duração

### 3. Google OAuth Credentials
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto
3. Ative Google+ API
4. Configure OAuth credentials

### 4. GitHub OAuth Credentials
1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Crie um novo OAuth App
3. Obtenha Client ID e Client Secret

---

## 🔒 Boas Práticas de Segurança

### ✅ O que Fazer

1. **Use variáveis de ambiente**: Nunca armazene credenciais no código
2. **Gere chaves fortes**: Use chaves aleatórias e longas
3. **Revogue tokens expirados**: Mantenha tokens atualizados
4. **Restrinja CORS**: Permita apenas domínios confiáveis
5. **Use HTTPS**: Sempre em produção
6. **Ative rate limiting**: Proteção contra abusos
7. **Monitore logs**: Acompanhe atividades suspeitas

### ❌ O que NÃO Fazer

1. **Compartilhar credenciais**: Nunca compartilhe Client IDs, Secrets ou Tokens
2. **Armazenar em repositórios**: Nunca commit credenciais no Git
3. **Usar chaves fracas**: Evite chaves como "123456" ou "secret"
4. **Desativar proteções**: Mantenha rate limiting e CORS ativos
5. **Usar tokens de curta duração**: Preferência por tokens de longa duração

---

## 📋 Checklist de Configuração

### Backend
- [ ] `PORT`
- [ ] `NODE_ENV`
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `FACEBOOK_APP_ID`
- [ ] `FACEBOOK_APP_SECRET`
- [ ] `FACEBOOK_ACCESS_TOKEN`
- [ ] `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
- [ ] `SESSION_SECRET`
- [ ] `FRONTEND_URL`

### Frontend
- [ ] `REACT_APP_API_URL`
- [ ] `REACT_APP_SOCKET_URL`

### Opcional
- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] SMTP/Email
- [ ] Redis
- [ ] Proxy Rotation
- [ ] Uptime Monitoring
- [ ] Analytics

---

## 🚀 Exemplo Completo (Produção)

### Backend (.env)
```env
# Server
PORT=10000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://darkFbUser:password@cluster0.mongodb.net/dark-fb?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key_here_1234567890
JWT_EXPIRES_IN=30d

# Facebook
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_ACCESS_TOKEN=EAAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
FACEBOOK_CALLBACK_URL=https://dark-fb-api.onrender.com/api/auth/facebook/callback

# OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://dark-fb-api.onrender.com/api/auth/google/callback
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=https://dark-fb-api.onrender.com/api/auth/github/callback

# Session
SESSION_SECRET=your_session_secret_key_here
SESSION_COOKIE_NAME=dark-fb-session
SESSION_COOKIE_MAX_AGE=86400000

# Frontend
FRONTEND_URL=https://dark-fb-dashboard.onrender.com
RENDER_URL=https://dark-fb-api.onrender.com

# CORS
CORS_ORIGIN=https://dark-fb-dashboard.onrender.com
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FILES_ENABLED=true

# Anti-Ban
RATE_LIMIT_ENABLED=true
ANTI_BAN_ENABLED=true
MAX_POSTS_PER_HOUR=50
MAX_MESSAGES_PER_MINUTE=20
RANDOM_DELAY_MIN=1000
RANDOM_DELAY_MAX=5000

# Features
MULTI_PROVIDER_AUTH=true
EMAIL_VERIFICATION=true
REALTIME_NOTIFICATIONS=true
ANALYTICS_ENABLED=true
SCHEDULED_POSTS=true
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://dark-fb-api.onrender.com/api
REACT_APP_SOCKET_URL=https://dark-fb-api.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
REACT_APP_FACEBOOK_APP_ID=1234567890123456
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id_here
```

---

## 📞 Suporte

- **GitHub Issues**: [https://github.com/onlynewsao-cmyk/DARK-FB/issues](https://github.com/onlynewsao-cmyk/DARK-FB/issues)
- **Documentação**: [https://github.com/onlynewsao-cmyk/DARK-FB](https://github.com/onlynewsao-cmyk/DARK-FB)

---

> **Nota**: Nunca inclua o arquivo `.env` no versionamento Git. Ele está no `.gitignore` por padrão.

> **Dica**: Para desenvolvimento local, crie o arquivo `.env` a partir do `.env.example`.
