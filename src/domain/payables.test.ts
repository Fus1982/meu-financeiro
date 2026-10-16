import { describe, expect, it } from 'vitest'
import { applyPartialPayment, pendingBalance } from './payables'
import type { PayableReceivable } from './types'
import { reaisToCents } from '../lib/money'

describe('payables', () => {
  const base: PayableReceivable = {
    id: '1',
    kind: 'payable',
    title: 'Conta',
    originalCents: reaisToCents(100),
    paidOrReceivedCents: 0,
    dueDate: '2026-12-01',
    status: 'open',
  }

  it('saldo pendente', () => {
    expect(pendingBalance(base)).toBe(reaisToCents(100))
    const partial = applyPartialPayment(base, reaisToCents(40))
    expect(pendingBalance(partial)).toBe(reaisToCents(60))
    expect(partial.status).toBe('partial')
  })
})
