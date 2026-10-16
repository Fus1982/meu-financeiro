import type { PayableReceivable } from './types'
import { subtractCents } from '../lib/money'

export function pendingBalance(item: PayableReceivable): number {
  return Math.max(0, subtractCents(item.originalCents, item.paidOrReceivedCents))
}

export function derivePayableStatus(
  item: PayableReceivable,
  today: Date = new Date(),
): PayableReceivable['status'] {
  const pending = pendingBalance(item)
  if (pending === 0) return 'settled'
  const due = new Date(item.dueDate)
  if (due < today && pending > 0) return 'overdue'
  if (item.paidOrReceivedCents > 0) return 'partial'
  return 'open'
}

export function applyPartialPayment(
  item: PayableReceivable,
  amountCents: number,
): PayableReceivable {
  const paidOrReceivedCents = item.paidOrReceivedCents + amountCents
  const updated = { ...item, paidOrReceivedCents }
  return { ...updated, status: derivePayableStatus(updated) }
}
