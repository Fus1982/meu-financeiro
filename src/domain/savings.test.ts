import { describe, expect, it } from 'vitest'
import { savingsGoalProgress } from './savings'
import type { Movement } from './types'
import { reaisToCents } from '../lib/money'

describe('savingsGoalProgress', () => {
  it('calcula reserva e percentual', () => {
    const movements: Movement[] = [
      {
        id: '1',
        userId: 'u',
        accountId: 'a',
        creditCardId: null,
        kind: 'savings_deposit',
        amountCents: reaisToCents(150),
        occurredAt: '2026-10-10T12:00:00.000Z',
        categoryId: null,
        incomeSourceId: null,
        description: 'Reserva',
        paymentMethod: null,
        status: 'confirmed',
        notes: null,
        transferGroupId: null,
        creditInvoiceId: null,
        payableReceivableId: null,
        clientUpdatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]
    const start = new Date('2026-10-01')
    const end = new Date('2026-10-31T23:59:59')
    const p = savingsGoalProgress({ monthlyTargetCents: reaisToCents(300) }, movements, start, end)
    expect(p.reservedCents).toBe(reaisToCents(150))
    expect(p.remainingCents).toBe(reaisToCents(150))
    expect(p.percent).toBe(50)
  })
})
