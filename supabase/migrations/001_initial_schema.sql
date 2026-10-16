-- Meu Financeiro — esquema inicial com RLS por usuário
-- Execute no SQL Editor do Supabase ou via CLI

create extension if not exists "pgcrypto";

-- Perfis
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  onboarding_completed boolean not null default false,
  notification_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorias
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  is_personal_budget boolean not null default false,
  active boolean not null default true,
  client_updated_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

-- Contas bancárias / carteira
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'cash', 'other')),
  initial_balance_cents bigint not null default 0,
  active boolean not null default true,
  client_updated_at timestamptz not null default now()
);

-- Fontes de receita (templates / cadastro)
create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('salary', 'daily', 'variable', 'other')),
  reference_amount_cents bigint,
  reference_label text,
  active boolean not null default true,
  client_updated_at timestamptz not null default now()
);

-- Despesas fixas (previsões)
create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  monthly_amount_cents bigint not null,
  category_id uuid references public.categories (id),
  paused boolean not null default false,
  day_of_month int check (day_of_month between 1 and 31),
  client_updated_at timestamptz not null default now()
);

-- Orçamento pessoal
create table if not exists public.personal_budget (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_limit_cents bigint not null,
  start_month text not null,
  opening_accumulated_cents bigint not null default 0,
  client_updated_at timestamptz not null default now()
);

-- Meta de economia
create table if not exists public.savings_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_target_cents bigint not null default 0,
  client_updated_at timestamptz not null default now()
);

-- Cartões
create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  limit_cents bigint not null,
  closing_day int not null,
  due_day int not null,
  client_updated_at timestamptz not null default now()
);

create table if not exists public.credit_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  reference_month text not null,
  total_cents bigint not null default 0,
  paid_cents bigint not null default 0,
  status text not null check (status in ('open', 'closed', 'paid')),
  due_date date not null,
  client_updated_at timestamptz not null default now()
);

create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  invoice_id uuid references public.credit_invoices (id),
  amount_cents bigint not null,
  installments int not null default 1,
  purchase_date date not null,
  description text not null default '',
  client_updated_at timestamptz not null default now()
);

-- Contas a pagar / receber
create table if not exists public.payables_receivables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('payable', 'receivable')),
  title text not null,
  original_cents bigint not null,
  paid_or_received_cents bigint not null default 0,
  due_date date not null,
  status text not null default 'open',
  client_updated_at timestamptz not null default now()
);

-- Movimentações
create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id),
  credit_card_id uuid references public.credit_cards (id),
  kind text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  occurred_at timestamptz not null,
  category_id uuid references public.categories (id),
  income_source_id uuid references public.income_sources (id),
  description text not null default '',
  payment_method text,
  status text not null default 'confirmed',
  notes text,
  transfer_group_id uuid,
  credit_invoice_id uuid references public.credit_invoices (id),
  payable_receivable_id uuid references public.payables_receivables (id),
  client_updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists movements_user_occurred_idx on public.movements (user_id, occurred_at desc);

-- Fila de sincronização (opcional no servidor para auditoria)
create table if not exists public.sync_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_id uuid not null,
  table_name text not null,
  operation text not null,
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.income_sources enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.personal_budget enable row level security;
alter table public.savings_goals enable row level security;
alter table public.credit_cards enable row level security;
alter table public.credit_invoices enable row level security;
alter table public.credit_purchases enable row level security;
alter table public.payables_receivables enable row level security;
alter table public.movements enable row level security;
alter table public.sync_log enable row level security;

create policy "profiles_own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income_sources_own" on public.income_sources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fixed_expenses_own" on public.fixed_expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "personal_budget_own" on public.personal_budget for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings_goals_own" on public.savings_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_cards_own" on public.credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_invoices_own" on public.credit_invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "credit_purchases_own" on public.credit_purchases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "payables_own" on public.payables_receivables for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "movements_own" on public.movements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sync_log_own" on public.sync_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
