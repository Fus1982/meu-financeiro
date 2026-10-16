# Changelog

## [0.1.1] — 2026-10-16

### Corrigido

- Fila de sincronização não é mais preenchida nem exibida quando o Supabase não está configurado (modo local).

## [0.1.0] — 2026-10-16

### Adicionado

- Projeto Vite + React + TypeScript + Tailwind + PWA (`vite-plugin-pwa`).
- Camada de domínio com valores em centavos e testes (saldos, orçamento acumulativo, cartão, sync, contas a pagar).
- Armazenamento local Dexie, fila de sincronização e cliente Supabase opcional.
- Migração SQL inicial com Row Level Security.
- Configuração inicial orientada com dados de referência (CAJAI, Brás, Mika Mel, despesas fixas, Inter, orçamento R$ 700).
- Dashboard com indicadores e gráficos (Recharts).
- Navegação: Início, Receitas, Despesas, Contas, Cartões, Orçamento, Metas, Relatórios, Configurações.
- Lançamento rápido, exportação JSON, notificações locais PWA.
- README, `.env.example`, TODO.
