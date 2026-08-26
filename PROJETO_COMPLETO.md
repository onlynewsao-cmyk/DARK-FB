# 📦 Facebook Bot - Projeto Completo

## 🎯 Visão Geral

Este é um **sistema completo de automação para Facebook** desenvolvido para o usuário **onlynewsao-cmyk**. O projeto inclui:

- ✅ **Backend API** com Node.js/Express
- ✅ **Frontend Dashboard** com React.js
- ✅ **Integração com Facebook Graph API**
- ✅ **Banco de dados MongoDB**
- ✅ **Autenticação JWT**
- ✅ **Sistema de agendamento**
- ✅ **Gerenciamento de mensagens**
- ✅ **Analytics e relatórios**
- ✅ **Notificações em tempo real** com Socket.io
- ✅ **Documentação Swagger**
- ✅ **Pronto para deploy no Render**
- ✅ **Monitoramento de uptime**

---

## 📁 Estrutura do Projeto

```
DARK-FB/
├── backend/                          # Backend API
│   ├── config/                       # Configurações
│   ├── controllers/                  # Controladores
│   │   ├── authController.js        # Autenticação
│   │   ├── facebookController.js    # Integração Facebook
│   │   ├── postController.js        # Publicações
│   │   ├── messageController.js     # Mensagens
│   │   ├── analyticsController.js   # Analytics
│   │   └── scheduledController.js   # Agendamento
│   │
│   ├── models/                       # Modelos MongoDB
│   │   ├── User.js                  # Usuários
│   │   ├── Post.js                  # Publicações
│   │   ├── Message.js               # Mensagens
│   │   ├── ScheduledPost.js         # Publicações agendadas
│   │   └── Analytics.js             # Analytics
│   │
│   ├── routes/                      # Rotas API
│   │   ├── authRoutes.js            # Rotas de autenticação
│   │   ├── facebookRoutes.js        # Rotas Facebook
│   │   ├── postRoutes.js            # Rotas de publicações
│   │   ├── messageRoutes.js         # Rotas de mensagens
│   │   ├── analyticsRoutes.js       # Rotas de analytics
│   │   └── scheduledRoutes.js       # Rotas de agendamento
│   │
│   ├── services/                    # Serviços
│   │   └── facebookService.js       # Serviço Facebook API
│   │
│   ├── middleware/                  # Middlewares
│   │   └── authMiddleware.js        # Middleware de autenticação
│   │
│   ├── server.js                   # Servidor principal
│   ├── package.json                # Dependências backend
│   └── .env.example                 # Variáveis de ambiente
│
├── frontend/                        # Frontend Dashboard
│   ├── public/                     # Arquivos públicos
│   │   ├── index.html              # HTML principal
│   │   └── manifest.json           # Manifest PWA
│   │
│   ├── src/                        # Código fonte
│   │   ├── components/              # Componentes React
│   │   │   ├── PrivateRoute.js      # Rota privada
│   │   │   ├── Sidebar.js           # Menu lateral
│   │   │   └── Navbar.js            # Barra de navegação
│   │   │
│   │   ├── pages/                  # Páginas
│   │   │   ├── LoginPage.js        # Login
│   │   │   ├── RegisterPage.js      # Registro
│   │   │   ├── DashboardPage.js     # Dashboard
│   │   │   ├── PostsPage.js         # Publicações
│   │   │   ├── CreatePostPage.js    # Criar publicação
│   │   │   ├── ScheduledPostsPage.js # Publicações agendadas
│   │   │   ├── MessagesPage.js      # Mensagens
│   │   │   ├── AnalyticsPage.js     # Analytics
│   │   │   ├── SettingsPage.js      # Configurações
│   │   │   ├── FacebookConnectPage.js # Conectar Facebook
│   │   │   ├── ConversationPage.js  # Conversa
│   │   │   └── PostDetailPage.js    # Detalhes da publicação
│   │   │
│   │   ├── context/                # Contextos React
│   │   │   ├── AuthContext.js      # Contexto de autenticação
│   │   │   └── SocketContext.js    # Contexto de socket
│   │   │
│   │   ├── styles/                 # Estilos
│   │   │   ├── App.css             # Estilos principais
│   │   │   └── index.css           # Estilos globais
│   │   │
│   │   ├── App.js                  # App principal
│   │   └── index.js                # Entry point
│   │
│   ├── package.json                # Dependências frontend
│   └── .env.example                 # Variáveis de ambiente
│
├── scripts/                         # Scripts de automação
│   ├── scheduler.js                 # Agendador de publicações
│   ├── init.sh                      # Script de inicialização
│   ├── deploy.sh                    # Script de deploy
│   └── uptime-monitor.json          # Configuração UptimeRobot
│
├── .gitignore                      # Ignore Git
├── package.json                    # Dependências root
├── render.yaml                     # Configuração Render
├── README.md                       # Documentação
├── INSTRUCOES.md                   # Instruções detalhadas
└── PROJETO_COMPLETO.md             # Este arquivo
```

---

## 🚀 Funcionalidades Implementadas

### 1. Autenticação
- ✅ Registro de usuários
- ✅ Login com email/senha
- ✅ JWT Token com expiração
- ✅ Refresh Token
- ✅ Esqueceu senha
- ✅ Trocar senha
- ✅ Logout
- ✅ Proteção de rotas

### 2. Integração Facebook
- ✅ Conectar páginas do Facebook
- ✅ Conectar grupos do Facebook
- ✅ Obter informações das páginas
- ✅ Publicar em páginas
- ✅ Publicar em grupos
- ✅ Upload de imagens
- ✅ Upload de vídeos
- ✅ Criar álbuns
- ✅ Webhook para mensagens
- ✅ Webhook para reações
- ✅ Webhook para comentários

### 3. Gerenciamento de Publicações
- ✅ Criar publicações
- ✅ Editar publicações
- ✅ Deletar publicações
- ✅ Publicar imediatamente
- ✅ Visualizar publicações
- ✅ Filtrar por status
- ✅ Exportar como CSV
- ✅ Estatísticas de publicações

### 4. Agendamento
- ✅ Agendar publicações
- ✅ Cancelar agendamento
- ✅ Publicar agora (publicações agendadas)
- ✅ Recorrência (diária, semanal, mensal)
- ✅ Limpeza de publicações antigas
- ✅ Scheduler automático (node-cron)

### 5. Gerenciamento de Mensagens
- ✅ Listar mensagens
- ✅ Ver conversas
- ✅ Responder mensagens
- ✅ Marcar como lida
- ✅ Arquivar mensagens
- ✅ Adicionar tags
- ✅ Pesquisar mensagens
- ✅ Exportar como CSV
- ✅ Notificações em tempo real

### 6. Analytics
- ✅ Visão geral
- ✅ Analytics de publicações
- ✅ Analytics de mensagens
- ✅ Analytics de engajamento
- ✅ Gráficos interativos
- ✅ Exportar analytics
- ✅ Métricas diárias
- ✅ Top publicações
- ✅ Top remetentes

### 7. Dashboard
- ✅ Estatísticas em tempo real
- ✅ Cartões de métricas
- ✅ Gráficos de engajamento
- ✅ Publicações recentes
- ✅ Mensagens recentes
- ✅ Páginas conectadas
- ✅ Ações rápidas

### 8. API
- ✅ RESTful API
- ✅ Documentação Swagger
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Health check endpoint

---

## 🔧 Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | >=18.0.0 | Runtime |
| Express | ^4.18.2 | Framework |
| MongoDB | ^8.0.3 | Banco de dados |
| Mongoose | ^8.0.3 | ODM |
| JWT | ^9.0.2 | Autenticação |
| Socket.io | ^4.7.4 | Tempo real |
| Axios | ^1.6.2 | HTTP Client |
| Swagger | ^6.2.8 | Documentação |
| Winston | ^3.11.0 | Logging |
| Node-cron | ^3.0.2 | Agendamento |
| Helmet | ^7.1.0 | Segurança |
| CORS | ^2.8.5 | CORS |
| Morgan | ^1.10.0 | Logging HTTP |
| Express-rate-limit | ^7.1.5 | Rate limiting |
| Bcrypt | ^2.4.3 | Hash de senhas |
| Dotenv | ^16.3.1 | Variáveis de ambiente |

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | ^18.2.0 | Framework |
| React Router | ^6.21.0 | Navegação |
| Axios | ^1.6.2 | HTTP Client |
| Socket.io-client | ^4.7.4 | Tempo real |
| React Chart.js | ^4.4.1 | Gráficos |
| Chart.js | ^4.4.1 | Engine de gráficos |
| Formik | ^2.4.5 | Formulários |
| Yup | ^1.3.3 | Validação |
| Framer Motion | ^10.16.16 | Animações |
| Lucide React | ^0.294.0 | Ícones |
| React Hot Toast | ^2.4.1 | Notificações |
| Date-fns | ^2.30.0 | Manipulação de datas |
| Recharts | ^2.10.4 | Gráficos alternativos |

### DevOps
| Tecnologia | Uso |
|------------|-----|
| Render | Deploy |
| MongoDB Atlas | Banco de dados |
| GitHub | Controle de versão |
| UptimeRobot | Monitoramento |
| concurrently | Execução paralela |

---

## 📊 Endpoints da API

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|------------|
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Obter usuário atual |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Esqueceu senha |
| POST | `/api/auth/reset-password` | Resetar senha |
| POST | `/api/auth/change-password` | Trocar senha |
| POST | `/api/auth/logout` | Logout |

### Facebook
| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | `/api/facebook/pages` | Listar páginas |
| GET | `/api/facebook/groups` | Listar grupos |
| POST | `/api/facebook/post` | Criar publicação |
| GET | `/api/facebook/posts` | Listar publicações |
| GET | `/api/facebook/messages` | Listar conversas |
| GET | `/api/facebook/messages/:id` | Mensagens da conversa |
| POST | `/api/facebook/send-message` | Enviar mensagem |
| GET | `/api/facebook/insights` | Insights da página |
| GET | `/api/facebook/webhook` | Verificar webhook |
| POST | `/api/facebook/webhook` | Receber eventos |
| POST | `/api/facebook/connect` | Conectar conta |
| DELETE | `/api/facebook/disconnect/:pageId` | Desconectar página |
| GET | `/api/facebook/search` | Pesquisar |

### Publicações
| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | `/api/posts` | Listar publicações |
| POST | `/api/posts` | Criar publicação |
| GET | `/api/posts/:id` | Obter publicação |
| PUT | `/api/posts/:id` | Atualizar publicação |
| POST | `/api/posts/:id/publish` | Publicar |
| DELETE | `/api/posts/:id` | Deletar |
| POST | `/api/posts/:id/schedule` | Agendar |
| POST | `/api/posts/:id/cancel-schedule` | Cancelar agendamento |
| GET | `/api/posts/:id/stats` | Estatísticas |
| GET | `/api/posts/export` | Exportar CSV |

### Mensagens
| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | `/api/messages` | Listar mensagens |
| GET | `/api/messages/unread` | Contar não lidas |
| GET | `/api/messages/:id` | Obter mensagem |
| POST | `/api/messages/:id/reply` | Responder |
| POST | `/api/messages/:id/mark-read` | Marcar como lida |
| POST | `/api/messages/:id/archive` | Arquivar |
| POST | `/api/messages/:id/tags` | Adicionar tags |
| GET | `/api/messages/conversations/:senderId` | Conversa |
| GET | `/api/messages/search` | Pesquisar |
| GET | `/api/messages/export` | Exportar CSV |

### Analytics
| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | `/api/analytics/overview` | Visão geral |
| GET | `/api/analytics/posts` | Analytics de publicações |
| GET | `/api/analytics/messages` | Analytics de mensagens |
| GET | `/api/analytics/engagement` | Analytics de engajamento |
| GET | `/api/analytics/export` | Exportar CSV |

### Agendamento
| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | `/api/scheduled` | Listar agendadas |
| GET | `/api/scheduled/upcoming` | Próximas |
| GET | `/api/scheduled/:id` | Obter agendada |
| PUT | `/api/scheduled/:id` | Atualizar |
| POST | `/api/scheduled/:id/cancel` | Cancelar |
| POST | `/api/scheduled/:id/publish-now` | Publicar agora |
| POST | `/api/scheduled/cleanup` | Limpar antigas |

### Health
| Método | Endpoint | Descrição |
|--------|----------|------------|
| GET | `/api/health` | Health check |
| GET | `/api-docs` | Swagger UI |

---

## 📱 Páginas do Dashboard

| Página | Rota | Descrição |
|--------|------|------------|
| Login | `/login` | Tela de login |
| Registro | `/register` | Tela de registro |
| Dashboard | `/dashboard` | Painel principal |
| Publicações | `/posts` | Listar publicações |
| Nova Publicação | `/posts/create` | Criar publicação |
| Detalhes Publicação | `/posts/:id` | Ver publicação |
| Agendadas | `/scheduled` | Publicações agendadas |
| Mensagens | `/messages` | Listar mensagens |
| Conversa | `/messages/:id` | Ver conversa |
| Analytics | `/analytics` | Analytics |
| Configurações | `/settings` | Configurações |
| Conectar Facebook | `/connect-facebook` | Conectar conta |

---

## 🎨 Componentes do Frontend

### Layout
- **Sidebar**: Menu lateral com navegação
- **Navbar**: Barra superior com buscas e notificações
- **PrivateRoute**: Proteção de rotas autenticadas

### UI
- **Buttons**: Botões com ícones e estados
- **Cards**: Cartões para informações
- **Tables**: Tabelas de dados
- **Charts**: Gráficos interativos
- **Modals**: Janelas modais
- **Badges**: Indicadores de status
- **Forms**: Formulários com validação

---

## 🔐 Segurança

### Implementações
- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ CORS Configuration
- ✅ Rate Limiting
- ✅ Helmet (Security Headers)
- ✅ Input Validation
- ✅ Error Handling
- ✅ HTTPS (recomendado para produção)

### Boas Práticas
- 🔒 Nunca compartilhe Access Tokens
- 🔒 Use variáveis de ambiente
- 🔒 Mantenha dependências atualizadas
- 🔒 Use tokens de longa duração (60 dias)
- 🔒 Renove tokens expirados
- 🔒 Monitore logs para atividades suspeitas

---

## 🚀 Como Deploy

### 1. GitHub
```bash
# Inicializar repositório
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/onlynewsao-cmyk/DARK-FB.git
git push -u origin main
```

### 2. Render
1. **Backend**:
   - Tipo: Web Service
   - Runtime: Node
   - Root Directory: backend
   - Build: `npm install`
   - Start: `npm start`
   - Variáveis de ambiente: Todas do `.env`

2. **Frontend**:
   - Tipo: Static Site
   - Root Directory: frontend
   - Build: `npm install && npm run build`
   - Publish Directory: frontend/build
   - Variáveis: `REACT_APP_API_URL`

3. **Scheduler** (opcional):
   - Tipo: Cron Job
   - Schedule: `* * * * *`
   - Command: `node scripts/scheduler.js`

4. **MongoDB**:
   - Tipo: Database
   - MongoDB Free Tier

### 3. Facebook
1. Crie um app em: [developers.facebook.com](https://developers.facebook.com/)
2. Configure webhook: `https://seu-backend.onrender.com/api/facebook/webhook`
3. Adicione permissões necessárias
4. Gere access token

### 4. UptimeRobot
1. Crie um monitor para: `https://seu-backend.onrender.com/api/health`
2. Configure alertas por email

---

## 📈 Performance

### Backend
- **Framework**: Express (leve e rápido)
- **Database**: MongoDB (NoSQL escalável)
- **Caching**: Pode ser adicionado (Redis)
- **Rate Limiting**: 100 requisições/15min por IP

### Frontend
- **Framework**: React (SPA eficiente)
- **Bundle**: Otimizado com Webpack
- **Lazy Loading**: Code splitting para rotas
- **Cache**: Service Worker (PWA)

---

## 📝 Changelog

### v1.0.0 (2026-08-26)
- ✅ Projeto inicial completo
- ✅ Backend com todas as funcionalidades
- ✅ Frontend com dashboard completo
- ✅ Integração com Facebook API
- ✅ MongoDB para persistência
- ✅ Autenticação JWT
- ✅ Agendamento de publicações
- ✅ Gerenciamento de mensagens
- ✅ Analytics e relatórios
- ✅ Documentação Swagger
- ✅ Pronto para deploy no Render

---

## 🎯 Roadmap Futuro

### v1.1.0
- [ ] Suporte a múltiplos idiomas
- [ ] Integração com Instagram
- [ ] Respostas automáticas com IA
- [ ] Análise de sentimentos
- [ ] Relatórios PDF

### v1.2.0
- [ ] Colaboração em equipe
- [ ] Aprovação de publicações
- [ ] Calendário visual
- [ ] Integração com Google Analytics
- [ ] Notificações push

### v2.0.0
- [ ] Versão SaaS
- [ ] Plano gratuito com limites
- [ ] Plano pago com mais recursos
- [ ] API pública
- [ ] Marketplace de templates

---

## 📞 Suporte

- **GitHub**: [https://github.com/onlynewsao-cmyk/DARK-FB](https://github.com/onlynewsao-cmyk/DARK-FB)
- **Issues**: [https://github.com/onlynewsao-cmyk/DARK-FB/issues](https://github.com/onlynewsao-cmyk/DARK-FB/issues)
- **Wiki**: [https://github.com/onlynewsao-cmyk/DARK-FB/wiki](https://github.com/onlynewsao-cmyk/DARK-FB/wiki)

---

## 🏆 Contribuindo

1. Fork o repositório
2. Crie uma branch de feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

## 💙 Agradecimentos

- À comunidade open source
- Ao Facebook por sua API
- Ao MongoDB por seu banco de dados
- Ao Render por seu serviço de deploy

---

**Facebook Bot** - Automatize sua presença no Facebook com facilidade.

💻 **Desenvolvido por**: [onlynewsao-cmyk](https://github.com/onlynewsao-cmyk)

📅 **Data**: 26 de Agosto de 2026

🌍 **Local**: Viana, Luanda, Angola

---

> **Nota**: Este projeto foi criado com ❤️ para ajudar na automação de publicações e mensagens no Facebook. Use com responsabilidade e respeite os termos de serviço do Facebook.
