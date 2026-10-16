import type { CreditCard, CreditInvoice, CreditPurchase, Movement } from './types'
import { addCents, subtractCents } from '../lib/money'
import { isMovementActive } from './balances'

export function invoicePurchasesTotal(purchases: CreditPurchase[]): number {
  return purchases.reduce((s, p) => s + p.amountCents, 0)
}

export function creditAvailableLimit(
  card: CreditCard,
  openPurchases: CreditPurchase[],
  unpaidInvoices: CreditInvoice[],
): number {
  const openTotal = openPurchases
    .filter((p) => p.invoiceId == null)
    .reduce((s, p) => s + p.amountCents, 0)
  const invoiceDebt = unpaidInvoices
    .filter((i) => i.status !== 'paid')
    .reduce((s, i) => s + subtractCents(i.totalCents, i.paidCents), 0)
  const used = addCents(openTotal, invoiceDebt)
  return Math.max(0, subtractCents(card.limitCents, used))
}

/** Pagamento de fatura não deve somar despesa extra — só movimentação bancária. */
export function countExpenseFromInvoicePayment(m: Movement): boolean {
  return m.kind === 'credit_invoice_payment' && isMovementActive(m)
}

export function applyInvoicePayment(
  invoice: CreditInvoice,
  paymentCents: number,
): CreditInvoice {
  const paidCents = addCents(invoice.paidCents, paymentCents)
  const status =
    paidCents >= invoice.totalCents
      ? 'paid'
      : paidCents > 0
        ? 'closed'
        : invoice.status
  return { ...invoice, paidCents, status: status === 'closed' && paidCents >= invoice.totalCents ? 'paid' : status }
}

export function installmentAmount(totalCents: number, installments: number): number {
  if (installments <= 0) return totalCents
  return Math.floor(totalCents / installments)
}
