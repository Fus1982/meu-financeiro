import { describe, expect, it } from 'vitest'
import { applyInvoicePayment, countExpenseFromInvoicePayment, creditAvailableLimit } from './creditCard'
import type { CreditCard, CreditInvoice, CreditPurchase, Movement } from './types'
import { reaisToCents } from '../lib/money'

describe('credit card', () => {
  const card: CreditCard = {
    id: 'c1',
    name: 'Inter',
    limitCents: reaisToCents(350),
    closingDay: 25,
    dueDay: 3,
  }

  it('calcula limite disponível', () => {
    const purchases: CreditPurchase[] = [
      { id: 'p1', cardId: 'c1', amountCents: reaisToCents(100), installments: 1, purchaseDate: '2026-10-01', description: 'x', invoiceId: null },
    ]
    const invoices: CreditInvoice[] = []
    expect(creditAvailableLimit(card, purchases, invoices)).toBe(reaisToCents(250))
  })

  it('pagamento de fatura não é despesa', () => {
    const m: Movement = {
      id: '1',
      userId: 'u',
      accountId: 'a',
      creditCardId: 'c1',
      kind: 'credit_invoice_payment',
      amountCents: reaisToCents(100),
      occurredAt: '2026-10-01',
      categoryId: null,
      incomeSourceId: null,
      description: 'Fatura',
      paymentMethod: 'pix',
      status: 'confirmed',
      notes: null,
      transferGroupId: null,
      creditInvoiceId: 'inv1',
      payableReceivableId: null,
      clientUpdatedAt: new Date().toISOString(),
      deletedAt: null,
    }
    expect(countExpenseFromInvoicePayment(m)).toBe(true)
    expect(m.kind).not.toBe('expense')
  })

  it('pagamento parcial de fatura', () => {
    const inv: CreditInvoice = {
      id: 'i1',
      cardId: 'c1',
      referenceMonth: '2026-10',
      totalCents: reaisToCents(200),
      paidCents: 0,
      status: 'closed',
      dueDate: '2026-11-03',
    }
    const partial = applyInvoicePayment(inv, reaisToCents(80))
    expect(partial.paidCents).toBe(reaisToCents(80))
    const full = applyInvoicePayment(partial, reaisToCents(120))
    expect(full.status).toBe('paid')
  })
})
