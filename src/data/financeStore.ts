import {
  DEFAULT_CATEGORIES,
  DEFAULT_CREDIT_CARD,
  DEFAULT_FIXED_EXPENSES,
  DEFAULT_INCOME_SOURCES,
  DEFAULT_PERSONAL_BUDGET_CENTS,
} from '../domain/defaults'
import type { Account, Movement, PayableReceivable } from '../domain/types'
import { currentMonthKey, monthKeyToString } from '../domain/budget'
import { localDb, type LocalCategory, type LocalFixedExpense, type LocalIncomeSource } from './localDb'
import { enqueueSync } from './syncEngine'
import { reaisToCents } from '../lib/money'

export const LOCAL_DEMO_USER = 'local-demo-user'

function uuid(): string {
  return crypto.randomUUID()
}

export async function loadFinanceState(userId: string) {
  const [
    profile,
    accounts,
    movements,
    incomeSources,
    fixedExpenses,
    personalBudget,
    savingsGoal,
    creditCards,
    creditInvoices,
    creditPurchases,
    payables,
    categories,
  ] = await Promise.all([
    localDb.profiles.get(userId),
    localDb.accounts.where('userId').equals(userId).toArray(),
    localDb.movements.where('userId').equals(userId).toArray(),
    localDb.incomeSources.where('userId').equals(userId).toArray(),
    localDb.fixedExpenses.where('userId').equals(userId).toArray(),
    localDb.personalBudget.get(userId),
    localDb.savingsGoals.get(userId),
    localDb.creditCards.toArray(),
    localDb.creditInvoices.toArray(),
    localDb.creditPurchases.toArray(),
    localDb.payables.toArray(),
    localDb.categories.where('userId').equals(userId).toArray(),
  ])

  return {
    profile,
    accounts,
    movements,
    incomeSources,
    fixedExpenses,
    personalBudget,
    savingsGoal,
    creditCards,
    creditInvoices,
    creditPurchases,
    payables,
    categories,
  }
}

export async function seedDefaultCategories(userId: string): Promise<LocalCategory[]> {
  const existing = await localDb.categories.where('userId').equals(userId).count()
  if (existing > 0) {
    return localDb.categories.where('userId').equals(userId).toArray()
  }
  const rows: LocalCategory[] = []
  for (const name of DEFAULT_CATEGORIES.income) {
    rows.push({ id: uuid(), userId, name, kind: 'income', isPersonalBudget: false })
  }
  for (const name of DEFAULT_CATEGORIES.expense) {
    rows.push({
      id: uuid(),
      userId,
      name,
      kind: 'expense',
      isPersonalBudget: name === 'Pessoal' || name === 'Lazer',
    })
  }
  await localDb.categories.bulkPut(rows)
  return rows
}

export async function completeOnboarding(input: {
  userId: string
  displayName: string
  accounts: { name: string; type: Account['type']; initialBalanceCents: number }[]
  monthlyBudgetCents: number
  savingsTargetCents: number
  notifications: Record<string, boolean>
}) {
  await localDb.profiles.put({
    userId: input.userId,
    displayName: input.displayName,
    onboardingCompleted: true,
    notificationSettings: input.notifications,
  })

  await seedDefaultCategories(input.userId)

  const incomeRows: LocalIncomeSource[] = DEFAULT_INCOME_SOURCES.map((s) => ({
    id: uuid(),
    userId: input.userId,
    ...s,
  }))
  await localDb.incomeSources.bulkPut(incomeRows)

  const fixedRows: LocalFixedExpense[] = DEFAULT_FIXED_EXPENSES.map((f) => ({
    id: uuid(),
    userId: input.userId,
    ...f,
  }))
  await localDb.fixedExpenses.bulkPut(fixedRows)

  const accountRows: Account[] = input.accounts.map((a) => ({
    id: uuid(),
    userId: input.userId,
    name: a.name,
    type: a.type,
    initialBalanceCents: a.initialBalanceCents,
    active: true,
  }))
  await localDb.accounts.bulkPut(accountRows)

  await localDb.personalBudget.put({
    userId: input.userId,
    monthlyLimitCents: input.monthlyBudgetCents || DEFAULT_PERSONAL_BUDGET_CENTS,
    startMonth: monthKeyToString(currentMonthKey()),
    openingAccumulatedCents: 0,
  })

  await localDb.savingsGoals.put({
    userId: input.userId,
    monthlyTargetCents: input.savingsTargetCents,
  })

  await localDb.creditCards.put({
    id: uuid(),
    ...DEFAULT_CREDIT_CARD,
  })

  await enqueueSync({
    id: input.userId,
    table: 'profiles',
    operation: 'update',
    payload: { onboarding_completed: true },
    clientUpdatedAt: new Date().toISOString(),
  })
}

export async function addMovement(userId: string, movement: Omit<Movement, 'id' | 'userId' | 'clientUpdatedAt'>) {
  const row: Movement = {
    ...movement,
    id: uuid(),
    userId,
    clientUpdatedAt: new Date().toISOString(),
  }
  await localDb.movements.put(row)
  await enqueueSync({
    id: row.id,
    table: 'movements',
    operation: 'insert',
    payload: row as unknown as Record<string, unknown>,
    clientUpdatedAt: row.clientUpdatedAt,
  })
  return row
}

export async function addQuickExpense(
  userId: string,
  accountId: string,
  amountCents: number,
  description: string,
  categoryId: string | null,
) {
  return addMovement(userId, {
    accountId,
    creditCardId: null,
    kind: 'expense',
    amountCents,
    occurredAt: new Date().toISOString(),
    categoryId,
    incomeSourceId: null,
    description,
    paymentMethod: 'outro',
    status: 'confirmed',
    notes: null,
    transferGroupId: null,
    creditInvoiceId: null,
    payableReceivableId: null,
    deletedAt: null,
  })
}

export async function addPayable(item: Omit<PayableReceivable, 'id' | 'status'> & { userId?: string }) {
  const row: PayableReceivable = {
    ...item,
    id: uuid(),
    status: 'open',
  }
  await localDb.payables.put(row)
  return row
}

export async function exportUserDataJson(userId: string): Promise<string> {
  const state = await loadFinanceState(userId)
  return JSON.stringify(state, null, 2)
}

export async function ensureLocalProfile(userId: string) {
  const existing = await localDb.profiles.get(userId)
  if (!existing) {
    await localDb.profiles.put({
      userId,
      displayName: 'Usuário',
      onboardingCompleted: false,
      notificationSettings: {
        dueAccounts: true,
        pendingIncome: true,
        budgetAlerts: true,
        weeklySummary: true,
      },
    })
  }
}

export function demoMovements(userId: string, accountId: string): Movement[] {
  const now = new Date()
  const month = now.getMonth()
  return [
    {
      id: uuid(),
      userId,
      accountId,
      creditCardId: null,
      kind: 'income',
      amountCents: reaisToCents(1500),
      occurredAt: new Date(now.getFullYear(), month, 5).toISOString(),
      categoryId: null,
      incomeSourceId: null,
      description: 'CAJAI — retirada recebida',
      paymentMethod: 'transferência',
      status: 'confirmed',
      notes: null,
      transferGroupId: null,
      creditInvoiceId: null,
      payableReceivableId: null,
      clientUpdatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: uuid(),
      userId,
      accountId,
      creditCardId: null,
      kind: 'expense',
      amountCents: reaisToCents(90),
      occurredAt: new Date(now.getFullYear(), month, 12).toISOString(),
      categoryId: null,
      incomeSourceId: null,
      description: 'Energia',
      paymentMethod: 'pix',
      status: 'confirmed',
      notes: null,
      transferGroupId: null,
      creditInvoiceId: null,
      payableReceivableId: null,
      clientUpdatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ]
}
