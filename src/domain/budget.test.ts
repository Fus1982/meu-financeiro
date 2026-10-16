import { describe, expect, it } from 'vitest'
import { computePersonalBudgetState } from './budget'
import type { Movement, PersonalBudgetSettings } from './types'
import { reaisToCents } from '../lib/money'

function expense(amount: number, date: string): Movement {
  return {
    id: crypto.randomUUID(),
    userId: 'u',
    accountId: 'a',
    creditCardId: null,
    kind: 'expense',
    amountCents: reaisToCents(amount),
    occurredAt: date,
    categoryId: null,
    incomeSourceId: null,
    description: '',
    paymentMethod: null,
    status: 'confirmed',
    notes: null,
    transferGroupId: null,
    creditInvoiceId: null,
    payableReceivableId: null,
    clientUpdatedAt: new Date().toISOString(),
    deletedAt: null,
  }
}

describe('computePersonalBudgetState acumulativo', () => {
  const settings: PersonalBudgetSettings = {
    monthlyLimitCents: reaisToCents(700),
    startMonth: '2026-08',
    openingAccumulatedCents: 0,
  }

  it('acumula saldo não utilizado no mês seguinte', () => {
    const movements = [
      expense(450, '2026-08-20T12:00:00.000Z'),
    ]
    const aug = computePersonalBudgetState(settings, movements, { year: 2026, month: 8 })
    expect(aug.remainingCents).toBe(reaisToCents(250))

    const sep = computePersonalBudgetState(settings, movements, { year: 2026, month: 9 })
    expect(sep.availableCents).toBe(reaisToCents(950))
    expect(sep.accumulatedBeforeMonthCents).toBe(reaisToCents(250))
  })
})
