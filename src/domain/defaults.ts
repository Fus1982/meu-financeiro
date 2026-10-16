import { reaisToCents } from '../lib/money'
import type { FixedExpenseTemplate, IncomeSourceTemplate } from './types'

export const DEFAULT_INCOME_SOURCES: Omit<IncomeSourceTemplate, 'id'>[] = [
  {
    name: 'CAJAI Estruturas Metálicas',
    kind: 'salary',
    referenceAmountCents: reaisToCents(1500),
    referenceLabel: 'Retirada pessoal prevista (mensal)',
  },
  {
    name: 'Trabalho no Brás',
    kind: 'daily',
    referenceAmountCents: reaisToCents(200),
    referenceLabel: 'Referência por diária',
  },
  {
    name: 'Mika Mel Doceria',
    kind: 'variable',
    referenceAmountCents: reaisToCents(150),
    referenceLabel: 'Referência semanal R$ 100–200',
  },
]

export const DEFAULT_FIXED_EXPENSES: Omit<FixedExpenseTemplate, 'id'>[] = [
  { name: 'Rastreador', monthlyAmountCents: reaisToCents(37), categoryId: null, paused: false, dayOfMonth: 10 },
  { name: 'Faculdade', monthlyAmountCents: reaisToCents(75), categoryId: null, paused: false, dayOfMonth: 5 },
  { name: 'Site Jaque', monthlyAmountCents: reaisToCents(120), categoryId: null, paused: false, dayOfMonth: 15 },
  { name: 'Energia', monthlyAmountCents: reaisToCents(90), categoryId: null, paused: false, dayOfMonth: 12 },
  { name: 'Internet', monthlyAmountCents: reaisToCents(30), categoryId: null, paused: false, dayOfMonth: 8 },
  { name: 'Academia', monthlyAmountCents: reaisToCents(120), categoryId: null, paused: false, dayOfMonth: 1 },
  { name: 'Alimentação', monthlyAmountCents: reaisToCents(400), categoryId: null, paused: false, dayOfMonth: null },
  { name: 'Combustível', monthlyAmountCents: reaisToCents(150), categoryId: null, paused: false, dayOfMonth: null },
]

export const DEFAULT_PERSONAL_BUDGET_CENTS = reaisToCents(700)

export const DEFAULT_CREDIT_CARD = {
  name: 'Banco Inter',
  limitCents: reaisToCents(350),
  closingDay: 25,
  dueDay: 3,
}

export const DEFAULT_CATEGORIES = {
  income: ['Salário', 'Freelance', 'Vendas', 'Outros'],
  expense: [
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Assinaturas',
    'Pessoal',
    'Outros',
  ],
}
