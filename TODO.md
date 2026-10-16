# TODO — Meu Financeiro

## Prioridade alta

- [ ] Formulário detalhado de movimentação (transferências, parcelas, cartão).
- [ ] CRUD completo de despesas fixas (pausar, vencimento, recorrência → lançamento).
- [ ] Diárias do Brás (previsto vs recebido vs pendente).
- [ ] Faturas de cartão (fechamento, compras parceladas, pagamento parcial).
- [ ] Contas a pagar/receber com UI de cadastro e pagamentos parciais.
- [ ] Sincronização bidirecional Supabase (pull + merge por `client_updated_at`).
- [ ] Testes E2E de offline → online.

## Prioridade média

- [ ] Edição/exclusão de lançamentos com histórico de alterações.
- [ ] Relatórios exportáveis (CSV/PDF).
- [ ] Ícones PWA em alta resolução.
- [x] App publicado no GitHub Pages (https://fus1982.github.io/meu-financeiro/).
- [ ] Cloudflare Pages (opcional; exige tokens da conta Cloudflare).
- [ ] Cron/worker gratuito para resumo semanal (ex.: Cloudflare Cron Trigger) se necessário.

## Prioridade baixa

- [ ] Tema claro.
- [ ] Importação de backup JSON.
- [ ] Recuperação de senha via Supabase.
