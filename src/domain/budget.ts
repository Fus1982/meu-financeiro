import type { Movement, MonthKey, PersonalBudgetSettings } from './types'
import { addCents, subtractCents } from '../lib/money'
import { isMovementActive } from './balances'
import { monthKeyToString, parseMonthKey } from './types'

function monthRange(key: MonthKey): { start: Date; end: Date } {
  const start = new Date(key.year, key.month - 1, 1, 0, 0, 0, 0)
  const end = new Date(key.year, key.month, 0, 23, 59, 59, 999)
  return { start, end }
}

function iterateMonths(from: MonthKey, to: MonthKey): MonthKey[] {
  const result: MonthKey[] = []
  let y = from.year
  let m = from.month
  while (y < to.year || (y === to.year && m <= to.month)) {
    result.push({ year: y, month: m })
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return result
}

function compareMonth(a: MonthKey, b: MonthKey): number {
  if (a.year !== b.year) return a.year - b.year
  return a.month - b.month
}

/** Gastos pessoais contabilizados no orçamento (despesas confirmadas, exceto reserva de economia). */
export function personalBudgetSpentInMonth(
  movements: Movement[],
  month: MonthKey,
  personalCategoryIds: Set<string> | null,
): number {
  const { start, end } = monthRange(month)
  return movements
    .filter((m) => {
      if (m.kind !== 'expense' || !isMovementActive(m)) return false
      const d = new Date(m.occurredAt)
      if (d < start || d > end) return false
      if (personalCategoryIds && m.categoryId) {
        return personalCategoryIds.has(m.categoryId)
      }
      return true
    })
    .reduce((s, m) => s + m.amountCents, 0)
}

/**
 * Orçamento pessoal com saldo acumulativo:
 * disponível no mês = limite mensal + saldo acumulado de meses anteriores - gastos do mês atual (até a data).
 */
export function computePersonalBudgetState(
  settings: PersonalBudgetSettings,
  movements: Movement[],
  targetMonth: MonthKey,
  personalCategoryIds: Set<string> | null = null,
): {
  monthlyLimitCents: number
  accumulatedBeforeMonthCents: number
  availableCents: number
  spentThisMonthCents: number
  remainingCents: number
} {
  const startKey = parseMonthKey(settings.startMonth)
  let accumulated = settings.openingAccumulatedCents

  const months = iterateMonths(startKey, targetMonth)
  for (let i = 0; i < months.length - 1; i++) {
    const mk = months[i]
    const spent = personalBudgetSpentInMonth(
      movements,
      mk,
      personalCategoryIds,
    )
    const unused = subtractCents(settings.monthlyLimitCents, spent)
    accumulated = addCents(accumulated, unused)
  }

  const spentThisMonth = personalBudgetSpentInMonth(
    movements,
    targetMonth,
    personalCategoryIds,
  )
  const available = addCents(settings.monthlyLimitCents, accumulated)
  const remaining = subtractCents(available, spentThisMonth)

  return {
    monthlyLimitCents: settings.monthlyLimitCents,
    accumulatedBeforeMonthCents: accumulated,
    availableCents: available,
    spentThisMonthCents: spentThisMonth,
    remainingCents: remaining,
  }
}

export function currentMonthKey(date = new Date()): MonthKey {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export { monthKeyToString, compareMonth }
