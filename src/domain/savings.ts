import type { Movement, SavingsGoalSettings } from './types'
import { subtractCents } from '../lib/money'
import { isMovementActive } from './balances'

export function sumSavingsDeposits(
  movements: Movement[],
  monthStart: Date,
  monthEnd: Date,
): number {
  return movements
    .filter(
      (m) =>
        m.kind === 'savings_deposit' &&
        isMovementActive(m) &&
        new Date(m.occurredAt) >= monthStart &&
        new Date(m.occurredAt) <= monthEnd,
    )
    .reduce((s, m) => s + m.amountCents, 0)
}

export function savingsGoalProgress(
  settings: SavingsGoalSettings,
  movements: Movement[],
  monthStart: Date,
  monthEnd: Date,
): {
  targetCents: number
  reservedCents: number
  remainingCents: number
  percent: number
} {
  const reservedCents = sumSavingsDeposits(movements, monthStart, monthEnd)
  const remainingCents = Math.max(
    0,
    subtractCents(settings.monthlyTargetCents, reservedCents),
  )
  const percent =
    settings.monthlyTargetCents > 0
      ? Math.min(100, (reservedCents / settings.monthlyTargetCents) * 100)
      : 0
  return {
    targetCents: settings.monthlyTargetCents,
    reservedCents,
    remainingCents,
    percent,
  }
}
