# VoluntaRIO - Plataforma de Voluntariado Marinho

Plataforma completa que conecta ONGs com causas marinhas a voluntários dispostos a contribuir, alinhada ao ODS 14 da ONU (Vida na Água).

🔗 **Acesse o site online:** [https://voluntario-production.up.railway.app/](https://voluntario-production.up.railway.app/)
## Tecnologias

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Hono + tRPC
- **Banco de Dados:** MySQL 8 + Drizzle ORM
- **Autenticação:** Local (email/senha com bcrypt + JWT) e Google OAuth
- **Email:** Resend

## Pré-requisitos

- Node.js 20+
- MySQL 8+
- npm

## Configuração Local

### 1. Banco de Dados

Crie um banco de dados MySQL:

```sql
CREATE DATABASE voluntario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Segredo para assinatura JWT (use uma string aleatória longa)
APP_SECRET=seu-segredo-aqui-mude-em-producao

# URL de conexão com MySQL
DATABASE_URL=mysql://usuario:senha@localhost:3306/voluntario

# Email do admin (opcional — o primeiro usuário registrado vira admin)
ADMIN_EMAIL=

# Configuração Resend para envio de emails
RESEND_API_KEY=sua-api-key
RESEND_FROM_EMAIL=VoluntaRIO <noreply@seudominio.com>
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Gerar e Executar Migrações

```bash
# Gerar migrações (já feito)
npm run db:generate

# Executar migrações no banco de dados
npm run db:migrate

# Ou usar push (alternativa)
npm run db:push
```

### 5. Popular Banco de Dados (Seed)

```bash
npm run db:seed
```

Isso irá criar as categorias iniciais de causas marinhas em português brasileiro.

### 6. Executar em Modo Desenvolvimento

```bash
npm run dev
```

O servidor será iniciado em `http://localhost:3000`.

### 7. Build para Produção

```bash
npm run build
npm run start
```

## Primeiros Passos

1. Acesse `http://localhost:3000`
2. Clique em "Criar Conta" na página inicial
3. O **primeiro usuário registrado automaticamente recebe o papel de Admin**
4. Escolha entre "Voluntário" ou "ONG" para os demais usuários

## Funcionalidades

### Autenticação
- Registro com email e senha
- Login com email e senha ou Google OAuth
- Hash de senhas com bcrypt
- Sessões via JWT em cookies HTTP-only

### Papéis de Usuário
- **Admin:** Controle total da plataforma, gerenciamento de usuários e categorias
- **ONG Manager:** Criação e gerenciamento de ONGs e eventos
- **Voluntário:** Inscrição em eventos, perfil de voluntário

### Categorias de Causas Marinhas
- 5 categorias pai pré-carregadas (em português brasileiro)
- 20 subcategorias vinculadas
- Admin pode adicionar/editar categorias

### Sistema de Eventos
- Criação com categoria obrigatória
- Filtros por localização, causa, data
- Ordenação por proximidade GPS (fórmula Haversine)
- Galeria de imagens por evento

### Inscrições e Fila de Espera
- Aceitação automática ou manual (configurável pela ONG)
- Fila de espera automática quando lotado
- Promoção automática da fila quando vaga é liberada

### Doações
- Doações de voluntários para ONGs
- Opção de doação anônima

### Certificados
- Emissão de certificados de participação em PDF
- Código de verificação único
- Registro de horas contribuídas

### Notificações e Mensagens
- Notificações in-app
- Envio de emails via Resend
- Sistema de mensagens entre usuários

### Recomendações
- Algoritmo com 80%+ peso em proximidade geográfica
- Histórico de eventos como filtro secundário
- Causas de interesse como filtro adicional

### Design
- Modo claro e escuro
- Acessibilidade (contraste, navegação por teclado)
- Identidade visual marinha com mascote polvo

## Estrutura do Projeto

```
├── api/                    # Backend (Hono + tRPC)
│   ├── lib/                # Utilitários (email, sessão, env)
│   ├── queries/            # Conexão e queries do banco
│   └── *-router.ts         # Rotas da API
├── contracts/              # Tipos e constantes compartilhados
├── db/                     # Banco de dados
│   ├── migrations/         # Migrações SQL
│   ├── schema.ts           # Schema do banco
│   ├── relations.ts        # Relações entre tabelas
│   └── seed.ts             # Dados iniciais
├── e2e/                    # Testes end-to-end
├── public/                 # Assets estáticos
├── src/                    # Frontend (React)
│   ├── components/         # Componentes reutilizáveis
│   ├── hooks/              # Hooks customizados
│   ├── lib/                # Utilitários do frontend
│   ├── pages/              # Páginas da aplicação
│   └── providers/          # Providers (tRPC, Theme)
├── .env.example            # Template de variáveis de ambiente
├── index.html              # Entry point do Vite
├── package.json            # Dependências do projeto
└── vite.config.ts          # Configuração do Vite
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run start` | Inicia servidor de produção |
| `npm run check` | Verificação de tipos TypeScript |
| `npm run db:generate` | Gera migrações |
| `npm run db:migrate` | Executa migrações |
| `npm run db:push` | Sincroniza schema com banco |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run lint` | Verificação de lint |
| `npm run format` | Formatação de código |

## Autores

- Felipe Moreira de Mattia
- Israel Matheus da Silva
- Davi Mendes de Moura
- Maria Eduarda Rodrigues de Almeida

**Curso:** Técnico em Desenvolvimento de Sistemas — ETEC
