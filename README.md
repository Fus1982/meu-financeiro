# Meu Financeiro

Aplicativo web progressivo (PWA) para administração de finanças pessoais: receitas, despesas, contas, cartões, orçamento acumulativo, metas de economia, relatórios e sincronização.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Supabase (auth, PostgreSQL, sync) — opcional
- IndexedDB (Dexie) para dados locais e fila offline
- Cloudflare Pages (hospedagem gratuita — ver guia abaixo)

## Executar localmente

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:43123`.

### Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Execute o SQL em `supabase/migrations/001_initial_schema.sql`.
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Sem Supabase, o app funciona em **modo local** (dados no navegador) e enfileira sync quando configurado.

## Scripts

| Comando        | Descrição              |
|----------------|------------------------|
| `npm run dev`  | Servidor de desenvolvimento |
| `npm run build`| Build de produção      |
| `npm run test` | Testes unitários (Vitest)|
| `npm run preview` | Preview do build    |

## Estrutura

- `src/domain/` — regras de negócio (saldos, orçamento, cartão, sync)
- `src/data/` — IndexedDB, Supabase, fila de sincronização
- `src/pages/` — telas
- `supabase/migrations/` — esquema PostgreSQL + RLS

## PWA

Instale pelo menu do navegador (Android/iOS/desktop). Service worker cacheia o app; lançamentos offline ficam na fila local.

### iPhone (sem App Store, sem custo)

1. Publique o app na **Cloudflare Pages** (passo a passo completo).
2. No **Safari**, abra o link `https://….pages.dev` → **Compartilhar** → **Adicionar à Tela de Início**.

Guia detalhado: [`docs/INSTALAR-IPHONE-E-PUBLICAR.md`](docs/INSTALAR-IPHONE-E-PUBLICAR.md)

## Publicar (Cloudflare Pages)

| Configuração | Valor |
|--------------|--------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Variáveis (opcional) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

## Documentação adicional

- `docs/INSTALAR-IPHONE-E-PUBLICAR.md` — publicar + instalar no iPhone
- `CHANGELOG.md` — histórico de alterações
- `TODO.md` — próximos passos
