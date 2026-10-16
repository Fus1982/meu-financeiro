import type { Account, Movement } from './types'
import { addCents } from '../lib/money'

const BALANCE_KINDS: Movement['kind'][] = [
  'income',
  'expense',
  'transfer_in',
  'transfer_out',
  'credit_invoice_payment',
  'savings_deposit',
  'savings_withdraw',
]

export function isMovementActive(m: Movement): boolean {
  return m.status === 'confirmed' && m.deletedAt == null
}

export function movementEffectOnAccount(m: Movement): number {
  if (!isMovementActive(m)) return 0
  switch (m.kind) {
    case 'income':
    case 'transfer_in':
    case 'savings_withdraw':
      return m.amountCents
    case 'expense':
    case 'transfer_out':
    case 'credit_invoice_payment':
    case 'savings_deposit':
      return -m.amountCents
    case 'credit_purchase':
      return 0
    default:
      return 0
  }
}

export function calculateAccountBalance(
  account: Account,
  movements: Movement[],
): number {
  const accountMovements = movements.filter(
    (m) => m.accountId === account.id && BALANCE_KINDS.includes(m.kind),
  )
  const delta = accountMovements.reduce(
    (sum, m) => sum + movementEffectOnAccount(m),
    0,
  )
  return addCents(account.initialBalanceCents, delta)
}

export function calculateTotalBalance(
  accounts: Account[],
  movements: Movement[],
): number {
  return accounts
    .filter((a) => a.active)
    .reduce((sum, a) => sum + calculateAccountBalance(a, movements), 0)
}

export function sumRealizedIncome(
  movements: Movement[],
  monthStart: Date,
  monthEnd: Date,
): number {
  return movements
    .filter(
      (m) =>
        m.kind === 'income' &&
        isMovementActive(m) &&
        new Date(m.occurredAt) >= monthStart &&
        new Date(m.occurredAt) <= monthEnd,
    )
    .reduce((s, m) => s + m.amountCents, 0)
}

export function sumRealizedExpenses(
  movements: Movement[],
  monthStart: Date,
  monthEnd: Date,
): number {
  return movements
    .filter(
      (m) =>
        m.kind === 'expense' &&
        isMovementActive(m) &&
        new Date(m.occurredAt) >= monthStart &&
        new Date(m.occurredAt) <= monthEnd,
    )
    .reduce((s, m) => s + m.amountCents, 0)
}

/** Transferências não entram em receita/despesa do mês. */
export function isTransferPair(m: Movement): boolean {
  return m.kind === 'transfer_in' || m.kind === 'transfer_out'
}
