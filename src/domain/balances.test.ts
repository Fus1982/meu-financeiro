import { describe, expect, it } from 'vitest'
import { calculateAccountBalance, sumRealizedExpenses, sumRealizedIncome } from './balances'
import type { Account, Movement } from './types'
import { reaisToCents } from '../lib/money'

const userId = 'user-1'
const accountId = 'acc-1'

function mov(partial: Partial<Movement> & Pick<Movement, 'kind' | 'amountCents'>): Movement {
  return {
    id: crypto.randomUUID(),
    userId,
    accountId,
    creditCardId: null,
    occurredAt: '2026-10-15T12:00:00.000Z',
    categoryId: null,
    incomeSourceId: null,
    description: '',
    paymentMethod: 'pix',
    status: 'confirmed',
    notes: null,
    transferGroupId: null,
    creditInvoiceId: null,
    payableReceivableId: null,
    clientUpdatedAt: new Date().toISOString(),
    deletedAt: null,
    ...partial,
  }
}

describe('calculateAccountBalance', () => {
  const account: Account = {
    id: accountId,
    userId,
    name: 'Conta',
    type: 'checking',
    initialBalanceCents: reaisToCents(1000),
    active: true,
  }

  it('soma receitas e subtrai despesas', () => {
    const movements = [
      mov({ kind: 'income', amountCents: reaisToCents(500) }),
      mov({ kind: 'expense', amountCents: reaisToCents(200) }),
    ]
    expect(calculateAccountBalance(account, movements)).toBe(reaisToCents(1300))
  })

  it('transferência não altera saldo total do sistema', () => {
    const acc2 = { ...account, id: 'acc-2', initialBalanceCents: 0 }
    const group = 'tg-1'
    const movements = [
      mov({ kind: 'transfer_out', amountCents: reaisToCents(100), accountId, transferGroupId: group }),
      mov({ kind: 'transfer_in', amountCents: reaisToCents(100), accountId: acc2.id, transferGroupId: group }),
    ]
    expect(calculateAccountBalance(account, movements)).toBe(reaisToCents(900))
    expect(calculateAccountBalance(acc2, movements)).toBe(reaisToCents(100))
  })

  it('ignora pendentes e cancelados', () => {
    const movements = [
      mov({ kind: 'income', amountCents: reaisToCents(500), status: 'pending' }),
    ]
    expect(calculateAccountBalance(account, movements)).toBe(reaisToCents(1000))
  })
})

describe('sumRealizedIncome/Expense', () => {
  it('não inclui transferências', () => {
    const start = new Date('2026-10-01')
    const end = new Date('2026-10-31T23:59:59')
    const movements = [
      mov({ kind: 'income', amountCents: reaisToCents(200) }),
      mov({ kind: 'transfer_in', amountCents: reaisToCents(100) }),
      mov({ kind: 'expense', amountCents: reaisToCents(50) }),
    ]
    expect(sumRealizedIncome(movements, start, end)).toBe(reaisToCents(200))
    expect(sumRealizedExpenses(movements, start, end)).toBe(reaisToCents(50))
  })
})
