# Instalar no iPhone (grátis) — PWA

**App no ar agora:** https://fus1982.github.io/meu-financeiro/

1. No iPhone, abra o **Safari**.
2. Acesse o link acima.
3. Toque em **Compartilhar** → **Adicionar à Tela de Início**.

Hospedagem atual: **GitHub Pages** (plano gratuito, sem Cloudflare). Cloudflare Pages fica como opção futura se você criar tokens depois.

## Parte 1 — Publicar na internet (uma vez)

### Opção A — GitHub Pages (já ativo, sem custo extra)

O repositório inclui `.github/workflows/deploy-github-pages.yml`. Cada push em `main` atualiza https://fus1982.github.io/meu-financeiro/

### Opção B — Automático (GitHub Actions + Cloudflare) *opcional*

O repositório inclui `.github/workflows/deploy-cloudflare-pages.yml`.

1. Envie o código para o GitHub (veja `scripts/publicar.sh` após `gh auth login`).
2. No GitHub: **Settings → Secrets and variables → Actions** → crie:
   - `CLOUDFLARE_API_TOKEN` (Cloudflare → My Profile → API Tokens → template *Edit Cloudflare Workers*)
   - `CLOUDFLARE_ACCOUNT_ID` (Cloudflare → Overview, coluna direita)
   - (Opcional) `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Cada push em `main` publica em `https://meu-financeiro.pages.dev` (ou URL que a Cloudflare mostrar).

### Opção B — Manual no painel Cloudflare

### 1. Repositório no GitHub

Se o projeto ainda não estiver no GitHub:

1. No Cursor, use **Create repo** (ou envie o código para um repositório seu no GitHub).
2. Confirme que a branch `main` está no GitHub.

### 2. Conta Cloudflare (grátis)

1. Acesse [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Crie a conta (plano Free).

### 3. Criar projeto Pages

1. No painel: **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autorize o GitHub e escolha o repositório **Meu Financeiro**.
3. Configuração de build:

| Campo | Valor |
|--------|--------|
| Framework preset | None (ou Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (raiz) |

4. **Environment variables** (opcional, para sync iPhone + PC depois):

| Nome | Valor |
|------|--------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave **anon** (pública) do Supabase |

5. Clique em **Save and Deploy**.

Em alguns minutos você recebe um link como:

`https://meu-financeiro-xxxx.pages.dev`

Guarde esse link — é o endereço do app.

### 4. Supabase (opcional, grátis — sync entre iPhone e Windows)

Sem Supabase, cada aparelho guarda dados **só nele**. Para o mesmo login no celular e no PC:

1. Crie projeto em [https://supabase.com](https://supabase.com) (plano free).
2. SQL Editor → cole e execute `supabase/migrations/001_initial_schema.sql`.
3. Em **Project Settings → API**, copie URL e chave **anon**.
4. Na Cloudflare Pages: **Settings → Environment variables** → adicione as duas variáveis acima → **Redeploy**.

---

## Parte 2 — Instalar no iPhone

1. No iPhone, abra o **Safari** (importante: use Safari).
2. Digite ou abra o link do Pages (`https://….pages.dev`).
3. Faça a **configuração inicial** do app (primeira vez).
4. Toque em **Compartilhar** (ícone com seta para cima).
5. **Adicionar à Tela de Início**.
6. Confirme **Adicionar**.

Pronto: o ícone **Meu Financeiro** fica na tela inicial e abre como app.

---

## Parte 3 — Usar no Windows

1. No Chrome ou Edge, abra o **mesmo link** HTTPS.
2. Opcional: instale como PWA (ícone na barra de endereço → “Instalar aplicativo”).
3. Com Supabase + mesma conta de e-mail, os dados sincronizam entre dispositivos.

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Página em branco ao trocar de tela | Confirme que existe `public/_redirects` no repo e redeploy. |
| iPhone não abre o site do PC | Use sempre o link **HTTPS** da Cloudflare, não `localhost`. |
| Dados diferentes no celular e no PC | Configure Supabase e faça login com a **mesma conta**. |
| Notificações não aparecem | No iOS, notificações PWA são limitadas; use o app para conferir vencimentos. |

---

## Custo

- Cloudflare Pages (plano Free): **R$ 0**
- PWA no iPhone: **R$ 0**
- Supabase (plano Free): **R$ 0** para uso pessoal moderado

Nenhuma taxa da Apple App Store.
