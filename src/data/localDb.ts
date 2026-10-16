import Dexie, { type Table } from 'dexie'
import type { SyncQueueItem } from '../domain/sync'
import type {
  Account,
  Movement,
  PayableReceivable,
  CreditCard,
  CreditInvoice,
  CreditPurchase,
} from '../domain/types'

export interface LocalProfile {
  userId: string
  displayName: string
  onboardingCompleted: boolean
  notificationSettings: Record<string, boolean>
}

export interface LocalCategory {
  id: string
  userId: string
  name: string
  kind: 'income' | 'expense'
  isPersonalBudget: boolean
}

export interface LocalIncomeSource {
  id: string
  userId: string
  name: string
  kind: 'salary' | 'daily' | 'variable' | 'other'
  referenceAmountCents: number | null
  referenceLabel: string | null
}

export interface LocalFixedExpense {
  id: string
  userId: string
  name: string
  monthlyAmountCents: number
  categoryId: string | null
  paused: boolean
  dayOfMonth: number | null
}

export interface LocalPersonalBudget {
  userId: string
  monthlyLimitCents: number
  startMonth: string
  openingAccumulatedCents: number
}

export interface LocalSavingsGoal {
  userId: string
  monthlyTargetCents: number
}

class MeuFinanceiroDb extends Dexie {
  profiles!: Table<LocalProfile, string>
  categories!: Table<LocalCategory, string>
  accounts!: Table<Account, string>
  movements!: Table<Movement, string>
  incomeSources!: Table<LocalIncomeSource, string>
  fixedExpenses!: Table<LocalFixedExpense, string>
  personalBudget!: Table<LocalPersonalBudget, string>
  savingsGoals!: Table<LocalSavingsGoal, string>
  creditCards!: Table<CreditCard, string>
  creditInvoices!: Table<CreditInvoice, string>
  creditPurchases!: Table<CreditPurchase, string>
  payables!: Table<PayableReceivable, string>
  syncQueue!: Table<SyncQueueItem, string>

  constructor() {
    super('MeuFinanceiro')
    this.version(1).stores({
      profiles: 'userId',
      categories: 'id, userId',
      accounts: 'id, userId',
      movements: 'id, userId, occurredAt',
      incomeSources: 'id, userId',
      fixedExpenses: 'id, userId',
      personalBudget: 'userId',
      savingsGoals: 'userId',
      creditCards: 'id',
      creditInvoices: 'id, cardId',
      creditPurchases: 'id, cardId',
      payables: 'id',
      syncQueue: 'id, table',
    })
  }
}

export const localDb = new MeuFinanceiroDb()
