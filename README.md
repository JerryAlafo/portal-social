# PORTAL — Rede Social para Otakus

Rede social moderna para a comunidade de anime e manga, construida com **Next.js 16.2**, **MUI**, **Lucide React** e **TypeScript**.

## Stack

- **Next.js 16.2.3** (App Router)
- **React 19**
- **TypeScript 5**
- **MUI (Material UI) v6** + **Lucide React** (iconografia)
- **CSS Modules** com design system via CSS Variables

## Como correr localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) no browser.

O servidor arranca na porta 3000. Sera redirecionado automaticamente para `/login`.

## Estrutura de paginas

| Rota | Descricao |
|------|-----------|
| `/login` | Login e registo de membros |
| `/feed` | Feed principal com publicacoes, trending e sugestoes |
| `/perfil` | Perfil de membro com publicacoes, galeria e fanfics |
| `/admin` | Painel de administracao (Super User) |
| `/mensagens` | Chat entre membros *(em desenvolvimento)* |
| `/noticias` | Area de noticias especiais *(em desenvolvimento)* |
| `/eventos` | Calendario de eventos *(em desenvolvimento)* |
| `/fanfics` | Area de fanfics *(em desenvolvimento)* |
| `/galeria` | Galeria de multimedia *(em desenvolvimento)* |
| `/pesquisar` | Pesquisa global *(em desenvolvimento)* |
| `/explorar` | Explorar conteudo *(em desenvolvimento)* |
| `/seguindo` | Feed de utilizadores seguidos *(em desenvolvimento)* |
| `/configuracoes` | Configuracoes de conta *(em desenvolvimento)* |

## Estrutura de ficheiros

```
portal/
├── app/
│   ├── globals.css          # Design system (CSS variables, dark/light)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Redirect para /login
│   ├── login/               # Pagina de login/registo
│   ├── feed/                # Feed principal
│   ├── perfil/              # Perfil de membro
│   ├── admin/               # Painel de administracao
│   └── [outras rotas]/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     # Shell com sidebar
│   │   ├── Sidebar.tsx      # Navegacao lateral
│   │   └── Topbar.tsx       # Barra superior com notificacoes
│   └── posts/
│       └── PostCard.tsx     # Card de publicacao reutilizavel
├── lib/
│   ├── mock-data.ts         # Dados de exemplo
│   └── theme-context.tsx    # Contexto de tema dark/light
└── package.json
```

## Funcionalidades implementadas

### Essenciais
- [x] Registo e login de membros
- [x] Feed de publicacoes com texto, imagem e multimedia
- [x] Interacao com publicacoes (likes, comentarios, partilha)
- [x] Moderacao para Super Users (apagar posts, gerir roles)

### Importantes
- [x] Sistema de seguidores (botao seguir/a seguir)
- [x] Perfil de membro personalizavel (banner, avatar, bio)
- [x] Feed de publicacoes no perfil
- [x] Notificacoes em tempo real (painel lateral)

### Relevante
- [x] Spoiler security (conteudo oculto com clique para revelar)
- [x] Tags e categorias nas publicacoes
- [x] Galeria de multimedia em grid
- [x] Area de fanfics no perfil

### Super User / Administracao
- [x] Posts de Super User aparecem sempre fixados em primeiro
- [x] Apagar posts de qualquer membro
- [x] Promover/rebaixar membros (Membro → Moderador → Super User)
- [x] Painel de denuncias com accoes rapidas
- [x] Dashboard com estatisticas da comunidade

## Tema

Suporte a **modo escuro** (default) e **modo claro**, com toggle disponivel na topbar. Todas as cores sao geridas via CSS Variables no `globals.css`.

## Proximos passos sugeridos

1. Integrar backend (ex: Supabase, Prisma + PostgreSQL)
2. Autenticacao real com NextAuth.js
3. Upload de imagens (Cloudinary, S3)
4. Chat em tempo real com WebSockets
5. Sistema de notificacoes push
6. Paginas de eventos, fanfics e galeria completas
