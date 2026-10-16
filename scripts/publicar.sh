#!/usr/bin/env bash
# Executado após `gh auth login` bem-sucedido no ambiente ou no seu PC.
set -euo pipefail

REPO_NAME="${1:-meu-financeiro}"
GITHUB_USER="$(gh api user -q .login)"

echo "Criando repositório github.com/${GITHUB_USER}/${REPO_NAME}..."
gh repo create "${REPO_NAME}" --public --source=. --remote=github --push --description "Meu Financeiro — PWA finanças pessoais"

echo ""
echo "Próximo passo (no GitHub → Settings → Secrets → Actions):"
echo "  CLOUDFLARE_API_TOKEN  — token com permissão Edit Cloudflare Pages"
echo "  CLOUDFLARE_ACCOUNT_ID — ID da conta (painel Cloudflare → Overview)"
echo "Opcional (sync): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY"
echo ""
echo "Depois: Actions → Deploy Cloudflare Pages → Run workflow (ou push em main)."
