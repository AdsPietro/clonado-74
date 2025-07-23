# 🚀 Configuração do Supabase para SisMobi

## 📋 Passo a Passo para Configurar o Supabase

### 1️⃣ **Criar Projeto no Supabase**
1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta gratuita
3. Clique em "New Project"
4. Preencha:
   - **Name**: SisMobi (ou nome de sua preferência)
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima do Brasil
5. Clique em "Create new project"
6. ⏳ Aguarde alguns minutos para o projeto ser criado

### 2️⃣ **Obter as Credenciais**
1. No dashboard do seu projeto, vá em **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public key** (chave longa que começa com `eyJ...`)

### 3️⃣ **Configurar Variáveis de Ambiente**
1. Abra o arquivo `/app/.env` 
2. Substitua os valores placeholder pelas suas credenciais reais:
   ```env
   VITE_SUPABASE_URL=https://sua-url-aqui.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

### 4️⃣ **Criar as Tabelas no Banco**
1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em "Run"
5. ✅ Verifique se todas as tabelas foram criadas com sucesso

### 5️⃣ **Verificar a Conexão**
1. Após configurar o .env, reinicie a aplicação
2. O console não deve mais mostrar "Supabase não configurado"
3. Os dados serão sincronizados automaticamente entre localStorage e Supabase

## 🏗️ **Estrutura do Banco de Dados**

O script SQL cria as seguintes tabelas:
- **properties** - Propriedades imobiliárias
- **tenants** - Inquilinos
- **transactions** - Transações financeiras
- **documents** - Documentos
- **energy_bills** - Contas de energia
- **water_bills** - Contas de água
- **informors** - Informors (ITR, IPTU, etc.)

## ⚡ **Funcionalidades Após Configuração**

Com o Supabase configurado, você terá:
- ✅ **Sincronização automática** entre dispositivos
- ✅ **Backup automático** na nuvem
- ✅ **Acesso de qualquer lugar**
- ✅ **Histórico completo** de alterações
- ✅ **Performance otimizada**

## 🔧 **Solução de Problemas**

### ❌ Erro de conexão:
- Verifique se as URLs estão corretas
- Certifique-se de que não há espaços extras nas variáveis
- Confirme se o projeto Supabase está ativo

### ❌ Erro de permissões:
- As tabelas devem ser criadas no schema `public`
- RLS (Row Level Security) está desabilitado por padrão

### ❌ Dados não sincronizam:
- Reinicie a aplicação após configurar o .env
- Verifique o console do navegador para erros

## 📞 **Suporte**

Se encontrar dificuldades, verifique:
1. Se as credenciais estão corretas no arquivo .env
2. Se as tabelas foram criadas com sucesso
3. Se há erros no console do navegador

---

**💡 Dica**: O sistema funciona tanto online (com Supabase) quanto offline (localStorage), alternando automaticamente conforme a disponibilidade da conexão!