# Instruções para Configuração e Uso do Facebook Bot

## 📋 Visão Geral

Este é um sistema completo de automação para Facebook que permite:
- Publicar em páginas, grupos e canais
- Responder mensagens automaticamente
- Agendar publicações
- Acompanhar métricas e analytics
- Gerenciar múltiplas contas

## 🚀 Passo a Passo para Configuração

### 1. Configuração do Repositório no GitHub

1. **Acesse o GitHub**: [https://github.com/onlynewsao-cmyk](https://github.com/onlynewsao-cmyk)
2. **Crie um novo repositório**: Clique em "New" no canto superior direito
3. **Nome do repositório**: `DARK-FB` (ou outro nome de sua preferência)
4. **Visibilidade**: Públic (Public) ou Privado (Private)
5. **Inicializar com README**: ❌ Não marque
6. **Adicionar .gitignore**: ❌ Não marque
7. **Escolher licença**: MIT (opcional)
8. **Criar repositório**

### 2. Enviar o Código para o GitHub

```bash
# Navegue até a pasta do projeto
cd /home/user/DARK-FB

# Inicialize o repositório Git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit - Facebook Bot complete system"

# Adicione o repositório remoto (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/onlynewsao-cmyk/DARK-FB.git

# Verifique o remote
git remote -v

# Envie para o GitHub
git push -u origin main
```

Se você recebe um erro de autenticação, configure suas credenciais:

```bash
# Configure seu nome de usuário
git config --global user.name "seu_nome"

# Configure seu email
git config --global user.email "seu@email.com"

# Para autenticação, você pode usar:
# Opção 1: Token de acesso pessoal (recomendado)
# Gere um token em: https://github.com/settings/tokens
# Com as permissões: repo, admin:repo_hook

echo "ghp_seu_token_aqui" > ~/.git-credentials
git config --global credential.helper store
```

### 3. Configuração do Backend

#### Instalar Dependências
```bash
cd backend
npm install
cd ..
```

#### Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env` (ou crie a partir do `.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# Obtenha sua URI do MongoDB Atlas em: https://www.mongodb.com/atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/DARK-FB?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=sua_chave_secreta_aqui_1234567890
JWT_EXPIRES_IN=30d

# Facebook API Configuration
# Crie um app no Facebook Developers: https://developers.facebook.com/
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret
FACEBOOK_ACCESS_TOKEN=seu_access_token
FACEBOOK_PAGE_ID=sua_page_id
FACEBOOK_GROUP_ID=seu_group_id

# Facebook Webhook
FACEBOOK_WEBHOOK_VERIFY_TOKEN=sua_chave_verificacao_webhook

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Render Configuration (para produção)
RENDER_URL=https://DARK-FB.onrender.com

# Uptime Monitoring
UPTIME_ROBOT_API_KEY=sua_api_key_uptime_robot

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

#### Configurar o Facebook App

1. **Acesse**: [https://developers.facebook.com/](https://developers.facebook.com/)
2. **Crie um novo App**: Clique em "Create App"
3. **Tipo de App**: "None" ou "Business"
4. **Nome do App**: Facebook Bot
5. **Email de contato**: seu@email.com
6. **Criar App**

7. **Adicione produtos ao seu app**:
   - Facebook Login
   - Pages
   - Groups
   - Messenger

8. **Configurações do App**:
   - **App ID**: Anote este valor para o `.env`
   - **App Secret**: Anote este valor para o `.env`
   
9. **Configurações de Login do Facebook**:
   - **Valid OAuth Redirect URIs**: `http://localhost:5000/api/facebook/connect`
   - **Site URL**: `http://localhost:3000`
   - **App Domains**: `localhost`

10. **Gerar Access Token**:
    - Vá em "Tools" > "Graph API Explorer"
    - Selecione seu app
    - Clique em "Get Token" > "Get User Access Token"
    - Selecione as permissões:
      - `pages_manage_posts`
      - `pages_read_engagement`
      - `pages_messaging`
      - `groups_access_member_info`
      - `publish_to_groups`
      - `email`
      - `public_profile`
    - Clique em "Generate Access Token"
    - Copie o token e cole no `.env` como `FACEBOOK_ACCESS_TOKEN`

11. **Obter Long-Lived Token** (opcional, mas recomendado):
    - O token gerado acima expira em 1-2 horas
    - Para obter um token de longa duração (60 dias):
    ```bash
    # Execute este comando com seu short-lived token
    curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=SEU_APP_ID&client_secret=SEU_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
    ```

### 4. Configuração do MongoDB

1. **Crie uma conta no MongoDB Atlas**: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Crie um novo cluster**: Grátis (M0)
3. **Configurações de rede**:
   - Adicione seu IP: 0.0.0.0/0 (para desenvolvimento local)
4. **Crie um usuário**:
   - Username: facebookBotUser
   - Password: sua_senha
5. **Conecte ao cluster**:
   - Clique em "Connect" > "Connect your application"
   - Copie a connection string e cole no `.env` como `MONGODB_URI`

### 5. Configuração do Frontend

#### Instalar Dependências
```bash
cd frontend
npm install
cd ..
```

#### Configurar Variáveis de Ambiente

Edite o arquivo `frontend/.env` (ou crie a partir do `.env.example`):

```env
# API URL - aponte para seu backend
REACT_APP_API_URL=http://localhost:5000/api

# Socket URL - para notificações em tempo real
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 6. Testar Localmente

#### Iniciar o Backend
```bash
cd backend
npm run dev
```

O backend estará disponível em: [http://localhost:5000](http://localhost:5000)
API Docs: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

#### Iniciar o Frontend
```bash
cd frontend
npm start
```

O frontend estará disponível em: [http://localhost:3000](http://localhost:3000)

### 7. Deploy no Render

#### Criar Conta no Render
1. Acesse: [https://render.com/](https://render.com/)
2. Crie uma conta (grátis)
3. Conecte seu GitHub

#### Configurar o Banco de Dados MongoDB no Render
1. No dashboard do Render, clique em "New" > "Database"
2. **Tipo**: MongoDB
3. **Nome**: DARK-FB-mongodb
4. **Plano**: Free
5. **Região**: Escolha a mais próxima de você
6. **IP Allow List**: 0.0.0.0/0 (para permitir todas as conexões)
7. **Criar Database**
8. **Anotar a URI de conexão** para usar no `.env` do Render

#### Deploy do Backend
1. No dashboard do Render, clique em "New" > "Web Service"
2. **Nome**: DARK-FB-api
3. **Tipo**: Node
4. **Região**: Escolha a mesma do banco de dados
5. **Plano**: Free
6. **Branch**: main
7. **Root Directory**: backend
8. **Build Command**: `npm install`
9. **Start Command**: `npm start`
10. **Environment Variables**:
    - `NODE_ENV`: production
    - `PORT`: 10000
    - `MONGODB_URI`: (a URI do seu banco MongoDB no Render)
    - `JWT_SECRET`: (gerar uma chave secreta)
    - `FACEBOOK_APP_ID`: (seu App ID)
    - `FACEBOOK_APP_SECRET`: (seu App Secret)
    - `FACEBOOK_ACCESS_TOKEN`: (seu Access Token)
    - `FACEBOOK_WEBHOOK_VERIFY_TOKEN`: (gerar uma chave)
    - `FRONTEND_URL`: https://DARK-FB-dashboard.onrender.com
11. **Auto-Deploy**: ✅ Marque
12. **Criar Service**

#### Deploy do Frontend
1. No dashboard do Render, clique em "New" > "Static Site"
2. **Nome**: DARK-FB-dashboard
3. **Branch**: main
4. **Root Directory**: frontend
5. **Build Command**: `npm install && npm run build`
6. **Publish Directory**: frontend/build
7. **Environment Variables**:
    - `REACT_APP_API_URL`: https://DARK-FB-api.onrender.com/api
    - `REACT_APP_SOCKET_URL`: https://DARK-FB-api.onrender.com
8. **Auto-Deploy**: ✅ Marque
9. **Criar Static Site**

#### Configurar o Scheduler (Opcional)
Para publicações agendadas funcionarem, você precisa configurar um Cron Job:

1. No dashboard do Render, clique em "New" > "Cron Job"
2. **Nome**: DARK-FB-scheduler
3. **Tipo**: Node
4. **Região**: Mesma do backend
5. **Plano**: Free
6. **Branch**: main
7. **Root Directory**: backend
8. **Schedule**: `* * * * *` (a cada minuto)
9. **Start Command**: `node scripts/scheduler.js`
10. **Environment Variables**: Mesmas do backend
11. **Criar Cron Job**

### 8. Configurar Webhook do Facebook

1. No seu app do Facebook Developers, vá em:
   **App Review** > **Webhooks**
2. **Adicionar Callback URL**:
   - URL: `https://DARK-FB-api.onrender.com/api/facebook/webhook`
   - Verify Token: (mesmo valor de `FACEBOOK_WEBHOOK_VERIFY_TOKEN` no Render)
3. **Assinar eventos**:
   - messages
   - messaging_postbacks
   - messaging_optins
   - message_reads
   - feed
   - reactions
   - comments
4. **Salvar**

### 9. Configurar Uptime Monitoring

1. **Crie uma conta no UptimeRobot**: [https://uptimerobot.com/](https://uptimerobot.com/)
2. **Adicione um novo monitor**:
   - **Tipo**: HTTP(s)
   - **URL**: `https://DARK-FB-api.onrender.com/api/health`
   - **Intervalo**: 5 minutos
   - **Alertar após**: 1 minuto
3. **Configure notificações**:
   - Adicione seu email para receber alertas

### 10. Acessar o Sistema

Após o deploy:
- **Dashboard**: https://DARK-FB-dashboard.onrender.com
- **API**: https://DARK-FB-api.onrender.com
- **API Docs**: https://DARK-FB-api.onrender.com/api-docs

## 📚 Como Usar o Sistema

### 1. Criar uma Conta
1. Acesse o dashboard
2. Clique em "Cadastre-se"
3. Preencha os dados
4. Faça login

### 2. Conectar sua Página do Facebook
1. No menu lateral, clique em "Conectar Facebook"
2. Clique em "Conectar com Facebook"
3. Autorize o aplicativo
4. Selecione a página que deseja gerenciar

### 3. Criar uma Publicação
1. No menu, clique em "Publicações"
2. Clique em "Nova Publicação"
3. Selecione o destino (Página ou Grupo)
4. Escreva o conteúdo
5. Adicione mídia se necessário
6. Escolha:
   - **Publicar agora**: Publica imediatamente
   - **Agendar**: Define data/hora para publicação
7. Clique em "Salvar"

### 4. Agendar Publicações
1. Ao criar uma publicação, selecione "Agendar"
2. Defina a data e hora
3. (Opcional) Configure recorrência:
   - Diária
   - Semanal
   - Mensal
4. Salve

### 5. Gerenciar Mensagens
1. No menu, clique em "Mensagens"
2. Veja a lista de mensagens
3. Clique em uma mensagem para ver a conversa
4. Responda diretamente do painel
5. Marque como lida ou arquive

### 6. Ver Analytics
1. No menu, clique em "Análises"
2. Veja:
   - Visão geral
   - Publicações
   - Mensagens
   - Engajamento
3. Exporte dados como CSV

## 🔧 Solução de Problemas

### Problema: Backend não inicia
**Solução**:
```bash
cd backend
npm install
npm start
```

Verifique se o MongoDB está conectado corretamente.

### Problema: Frontend não carrega
**Solução**:
- Verifique se o backend está rodando
- Verifique o console do navegador (F12)
- Verifique se as variáveis de ambiente do frontend estão corretas

### Problema: Não consegue conectar ao Facebook
**Solução**:
- Verifique se o App ID e App Secret estão corretos
- Verifique se o Access Token não expirou
- Verifique as permissões do token
- Verifique se o domínio está configurado corretamente no Facebook

### Problema: Publicações agendadas não são publicadas
**Solução**:
- Verifique se o Scheduler está rodando (Cron Job no Render)
- Verifique os logs do scheduler
- Verifique se o Access Token não expirou

### Problema: Webhook não funciona
**Solução**:
- Verifique se o Verify Token está correto
- Verifique se a URL do webhook está acessível
- Teste o endpoint: `/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test`

## 📞 Suporte

- **GitHub Issues**: [https://github.com/onlynewsao-cmyk/DARK-FB/issues](https://github.com/onlynewsao-cmyk/DARK-FB/issues)
- **Documentação**: [https://github.com/onlynewsao-cmyk/DARK-FB/wiki](https://github.com/onlynewsao-cmyk/DARK-FB/wiki)

## 🔒 Segurança

- Nunca compartilhe seu Access Token
- Use HTTPS em produção
- Mantenha suas dependências atualizadas
- Use tokens de longa duração (60 dias)
- Renove tokens expirados

## 📈 Melhores Práticas

1. **Tokens**: Sempre use tokens de longa duração
2. **Rate Limiting**: O Facebook tem limites de requisições
   - 200 requisições por hora por token
   - 100 requisições por hora por página
3. **Agendamento**: Agende publicações com antecedência
4. **Backup**: Faça backup regular do banco de dados
5. **Logs**: Monitore os logs para erros

---

**Facebook Bot** - Automatize sua presença no Facebook com facilidade.

Feito com ❤️ por [onlynewsao-cmyk](https://github.com/onlynewsao-cmyk)
