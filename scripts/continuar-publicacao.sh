#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! gh auth status >/dev/null 2>&1; then
  if [[ -n "${GH_TOKEN:-}" ]]; then
    echo "Autenticando com GH_TOKEN..."
    echo "$GH_TOKEN" | gh auth login --with-token
  fi
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub não autenticado."
  echo "  • iPhone/Safari: https://github.com/login/device (código exibido por gh auth login)"
  echo "  • Ou defina GH_TOKEN (PAT classic, escopo repo) no ambiente."
  exit 1
fi

./scripts/publicar.sh "${1:-meu-financeiro}"

echo ""
echo "Aguardando secrets Cloudflare no GitHub Actions..."
echo "Após configurar CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID:"
echo "  gh workflow run deploy-cloudflare-pages.yml"
echo "ou push em main."

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" && -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  npm ci
  npm run build
  npx wrangler pages deploy dist --project-name=meu-financeiro --commit-dirty=true
  echo "Deploy direto concluído (se o projeto Pages existir na conta)."
fi
