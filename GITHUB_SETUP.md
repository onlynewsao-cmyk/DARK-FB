# 🔑 Configuração do GitHub com Token de Acesso Pessoal

## 📌 Token Fornecido

O usuário forneceu um token de acesso pessoal do GitHub:
```
ghp_REMOVIDO_POR_SEGURANCA
```

> ⚠️ **AVISO**: Este token foi exposto e NÃO deve mais ser usado! Qualquer pessoa com este token pode acessar seus repositórios com as permissões concedidas. **REVOGUE ESTE TOKEN IMEDIATAMENTE!**

---

## 🚨 Ações Imediatas (IMPORTANTE!)

### 1. Revogar o Token Atual

1. **Acesse**: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. **Localize o token**: `ghp_REMOVIDO_POR_SEGURANCA`
3. **Clique em "Revoke"** (Revogar)
4. **Confirme** a revogação

### 2. Gerar um Novo Token

1. **Acesse**: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. **Clique em "Generate new token"** (Gerar novo token)
3. **Configure o token**:
   - **Note**: Facebook Bot - Full Access
   - **Expiration**: 30 days (ou Custom para mais tempo)
   - **Select scopes**:
     - ✅ `repo` - Full control of private repositories
     - ✅ `admin:repo_hook` - Manage repository webhooks
     - ✅ `workflow` - Update GitHub Action workflows
     - ✅ `delete_repo` - Delete repositories
     - ✅ `read:org` - Read organization data
     - ✅ `write:org` - Write organization data
   - **Generate token**

4. **Copie o novo token** (ele só será exibido uma vez!)

---

## 🔐 Como Usar o Novo Token

### Opção 1: Usar com Git no Terminal

#### Linux/Mac
```bash
# Salvar o token em um arquivo seguro
echo "ghp_seu_novo_token_aqui" > ~/.github_token
chmod 600 ~/.github_token

# Configurar o Git para usar o token
git config --global credential.helper 'cache --timeout=3600'
git config --global credential.helper store

# Ou usar diretamente na URL
git clone https://ghp_seu_novo_token_aqui@github.com/onlynewsao-cmyk/facebook-bot.git
```

#### Windows
```bash
# Salvar em um arquivo
echo ghp_seu_novo_token_aqui > %USERPROFILE%\.github_token

# Configurar o Git
git config --global credential.helper manager
```

### Opção 2: Usar com Git Credential Manager

1. **Instale o Git Credential Manager**:
   ```bash
   git config --global credential.helper manager
   ```

2. **Na próxima vez que fizer push/pull, o Git vai pedir suas credenciais**
3. **Digite seu username do GitHub**
4. **Cole o token como senha**

### Opção 3: Configurar .git-credentials

```bash
# Adicionar ao arquivo de credenciais
echo "https://onlynewsao-cmyk:ghp_seu_novo_token_aqui@github.com" >> ~/.git-credentials

# Configurar o Git para usar este arquivo
git config --global credential.helper store
```

---

## 🛡️ Boas Práticas de Segurança

### 1. Nunca Compartilhe Tokens
- ❌ Não envie tokens em emails
- ❌ Não envie tokens em mensagens
- ❌ Não salve tokens em repositórios públicos
- ❌ Não use tokens em URLs em navegadores

### 2. Armazene Tokens com Segurança
- ✅ Use variáveis de ambiente
- ✅ Use gerenciadores de segredos (Vault, AWS Secrets Manager)
- ✅ Use arquivos .env (e adicione ao .gitignore)
- ✅ Crie tokens com tempo de expiração curto

### 3. Permissões Mínimas
- Crie tokens com apenas as permissões necessárias
- Não use tokens com permissão de admin se não for necessário

### 4. Roteção de Tokens
- Revogue tokens antigos regularmente
- Gere novos tokens periodicamente
- Use tokens diferentes para diferentes aplicações

---

## 📝 Configuração do Repositório

### 1. Criar o Repositório no GitHub

```bash
# Acesse o GitHub e crie um novo repositório
# Ou use a API:
curl -X POST \
  -H "Authorization: token ghp_seu_novo_token_aqui" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{"name":"facebook-bot","private":false,"description":"Facebook Bot - Complete Automation Solution"}'
```

### 2. Configurar o Repositório Local

```bash
# Navegue até a pasta do projeto
cd /home/user/facebook-bot

# Inicialize o Git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit - Facebook Bot complete system"

# Adicione o repositório remoto
git remote add origin https://github.com/onlynewsao-cmyk/facebook-bot.git

# Verifique o remote
git remote -v
```

### 3. Enviar para o GitHub

```bash
# Envie para o GitHub (usando o token)
git push -u origin main

# Se pedir autenticação, digite:
# Username: onlynewsao-cmyk
# Password: ghp_seu_novo_token_aqui
```

---

## 🔧 Configurar Webhooks (Opcional)

### 1. Adicionar Webhook para Deploy Automático

```bash
# Usando a API do GitHub
curl -X POST \
  -H "Authorization: token ghp_seu_novo_token_aqui" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/onlynewsao-cmyk/facebook-bot/hooks \
  -d '{
    "name": "web",
    "active": true,
    "events": ["push", "pull_request"],
    "config": {
      "url": "https://api.render.com/deploy/srv-xxxxx",
      "content_type": "json"
    }
  }'
```

---

## 📌 Configurar Variáveis de Ambiente no GitHub

Para projetos que usam GitHub Actions ou Secrets:

```bash
# Adicionar um segredo usando a API
curl -X PUT \
  -H "Authorization: token ghp_seu_novo_token_aqui" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/onlynewsao-cmyk/facebook-bot/secrets/MONGODB_URI \
  -d '{"encrypted_value":"...","key_id":"..."}'
```

Ou faça manualmente:
1. Acesse o repositório no GitHub
2. Vá em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione suas variáveis de ambiente

---

## 🚀 Scripts Úteis

### Script para Configurar Tudo

```bash
#!/bin/bash

# Facebook Bot - GitHub Setup Script

# Variáveis
REPO_NAME="facebook-bot"
GITHUB_USER="onlynewsao-cmyk"
GITHUB_TOKEN="ghp_seu_novo_token_aqui"

# Criar repositório
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Facebook Bot - Complete Automation Solution\"}"

# Configurar repositório local
cd /home/user/facebook-bot
git init
git add .
git commit -m "Initial commit - Facebook Bot complete system"
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git

# Enviar para o GitHub
git push -u origin main

echo "✓ Repositório criado e código enviado para o GitHub!"
```

---

## 📞 Suporte

Se tiver problemas com o GitHub:
- **GitHub Support**: [https://support.github.com/](https://support.github.com/)
- **GitHub Docs**: [https://docs.github.com/](https://docs.github.com/)
- **GitHub API Docs**: [https://docs.github.com/en/rest](https://docs.github.com/en/rest)

---

## 🔒 Checklist de Segurança

- [ ] Token antigo revogado
- [ ] Novo token gerado
- [ ] Novo token armazenado com segurança
- [ ] Token não está no código ou repositório
- [ ] Token tem permissões mínimas necessárias
- [ ] Token tem tempo de expiração adequado
- [ ] Variáveis de ambiente configuradas
- [ ] .gitignore atualizado (inclui .env, node_modules, etc.)

---

> **⚠️ LEMBRETE**: O token `ghp_REMOVIDO_POR_SEGURANCA` foi exposto e **DEVE SER REVOGADO IMEDIATAMENTE**. Qualquer pessoa que acessar este arquivo poderá usar este token até que ele seja revogado.

**Ação recomendada**:
1. Revogue o token agora: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Gere um novo token
3. Atualize todas as configurações que usavam o token antigo
