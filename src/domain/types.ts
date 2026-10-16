import type { Cents } from '../lib/money'

export type UUID = string

export type MovementKind =
  | 'income'
  | 'expense'
  | 'transfer_out'
  | 'transfer_in'
  | 'credit_purchase'
  | 'credit_invoice_payment'
  | 'savings_deposit'
  | 'savings_withdraw'

export type MovementStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Movement {
  id: UUID
  userId: UUID
  accountId: UUID | null
  creditCardId: UUID | null
  kind: MovementKind
  amountCents: Cents
  occurredAt: string
  categoryId: UUID | null
  incomeSourceId: UUID | null
  description: string
  paymentMethod: string | null
  status: MovementStatus
  notes: string | null
  transferGroupId: UUID | null
  creditInvoiceId: UUID | null
  payableReceivableId: UUID | null
  clientUpdatedAt: string
  deletedAt: string | null
}

export interface Account {
  id: UUID
  userId: UUID
  name: string
  type: 'checking' | 'savings' | 'cash' | 'other'
  initialBalanceCents: Cents
  active: boolean
}

export interface FixedExpenseTemplate {
  id: UUID
  name: string
  monthlyAmountCents: Cents
  categoryId: UUID | null
  paused: boolean
  dayOfMonth: number | null
}

export interface IncomeSourceTemplate {
  id: UUID
  name: string
  kind: 'salary' | 'daily' | 'variable' | 'other'
  referenceAmountCents: Cents | null
  referenceLabel: string | null
}

export interface PersonalBudgetSettings {
  monthlyLimitCents: Cents
  /** Mês de referência YYYY-MM para saldo acumulado inicial */
  startMonth: string
  /** Saldo acumulado antes de startMonth (centavos) */
  openingAccumulatedCents: Cents
}

export interface SavingsGoalSettings {
  monthlyTargetCents: Cents
}

export interface CreditCard {
  id: UUID
  name: string
  limitCents: Cents
  closingDay: number
  dueDay: number
}

export interface CreditPurchase {
  id: UUID
  cardId: UUID
  amountCents: Cents
  installments: number
  purchaseDate: string
  description: string
  invoiceId: UUID | null
}

export interface CreditInvoice {
  id: UUID
  cardId: UUID
  referenceMonth: string
  totalCents: Cents
  paidCents: Cents
  status: 'open' | 'closed' | 'paid'
  dueDate: string
}

export interface PayableReceivable {
  id: UUID
  kind: 'payable' | 'receivable'
  title: string
  originalCents: Cents
  paidOrReceivedCents: Cents
  dueDate: string
  status: 'open' | 'partial' | 'settled' | 'overdue'
}

export interface MonthKey {
  year: number
  month: number
}

export function monthKeyToString({ year, month }: MonthKey): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthKey(key: string): MonthKey {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}
