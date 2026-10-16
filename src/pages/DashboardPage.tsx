import { useEffect, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { Card, CardTitle, CardValue } from '../components/ui/Card'
import { formatBRL } from '../lib/money'
import { calculateTotalBalance, sumRealizedExpenses, sumRealizedIncome } from '../domain/balances'
import { computePersonalBudgetState, currentMonthKey } from '../domain/budget'
import { savingsGoalProgress } from '../domain/savings'
import { derivePayableStatus, pendingBalance } from '../domain/payables'
import { creditAvailableLimit } from '../domain/creditCard'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { runNotificationChecks, scheduleWeeklySummaryHint } from '../services/notifications'
import { QuickTransactionFab } from '../components/QuickTransactionModal'

export function DashboardPage() {
  const {
    accounts,
    movements,
    personalBudget,
    savingsGoal,
    payables,
    fixedExpenses,
    creditCards,
    creditPurchases,
    creditInvoices,
    profile,
  } = useFinance()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const totalBalance = useMemo(() => calculateTotalBalance(accounts, movements), [accounts, movements])
  const incomeMonth = useMemo(
    () => sumRealizedIncome(movements, monthStart, monthEnd),
    [movements, monthStart, monthEnd],
  )
  const expenseMonth = useMemo(
    () => sumRealizedExpenses(movements, monthStart, monthEnd),
    [movements, monthStart, monthEnd],
  )

  const budgetState = useMemo(() => {
    if (!personalBudget) return null
    return computePersonalBudgetState(
      {
        monthlyLimitCents: personalBudget.monthlyLimitCents,
        startMonth: personalBudget.startMonth,
        openingAccumulatedCents: personalBudget.openingAccumulatedCents,
      },
      movements,
      currentMonthKey(now),
    )
  }, [personalBudget, movements, now])

  const savings = useMemo(() => {
    if (!savingsGoal) return null
    return savingsGoalProgress(
      { monthlyTargetCents: savingsGoal.monthlyTargetCents },
      movements,
      monthStart,
      monthEnd,
    )
  }, [savingsGoal, movements, monthStart, monthEnd])

  const payablesStats = useMemo(() => {
    let overdue = 0
    let dueSoon = 0
    let pendingPay = 0
    let pendingRecv = 0
    for (const p of payables) {
      const st = derivePayableStatus(p, now)
      const pend = pendingBalance(p)
      if (p.kind === 'payable') pendingPay += pend
      else pendingRecv += pend
      const due = new Date(p.dueDate)
      const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (st === 'overdue') overdue++
      else if (p.kind === 'payable' && diff >= 0 && diff <= 7) dueSoon++
    }
    return { overdue, dueSoon, pendingPay, pendingRecv, countRecv: payables.filter((p) => p.kind === 'receivable' && pendingBalance(p) > 0).length }
  }, [payables, now])

  const card = creditCards[0]
  const limitAvailable = card
    ? creditAvailableLimit(card, creditPurchases, creditInvoices)
    : 0

  const chartMonths = useMemo(() => {
    const items = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const label = start.toLocaleDateString('pt-BR', { month: 'short' })
      items.push({
        name: label,
        receitas: sumRealizedIncome(movements, start, end) / 100,
        despesas: sumRealizedExpenses(movements, start, end) / 100,
      })
    }
    return items
  }, [movements, now])

  useEffect(() => {
    if (!profile) return
    runNotificationChecks({
      prefs: {
        dueAccounts: profile.notificationSettings.dueAccounts ?? true,
        pendingIncome: profile.notificationSettings.pendingIncome ?? true,
        budgetAlerts: profile.notificationSettings.budgetAlerts ?? true,
        weeklySummary: profile.notificationSettings.weeklySummary ?? true,
      },
      overduePayables: payablesStats.overdue,
      dueSoonPayables: payablesStats.dueSoon,
      pendingReceivables: payablesStats.countRecv,
      budgetRemainingCents: budgetState?.remainingCents ?? 0,
      budgetAvailableCents: budgetState?.availableCents ?? 1,
    })
    scheduleWeeklySummaryHint()
  }, [profile, payablesStats, budgetState])

  const fixedTotal = fixedExpenses.filter((f) => !f.paused).reduce((s, f) => s + f.monthlyAmountCents, 0)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Início</h1>
        <p className="text-sm text-slate-400">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle>Saldo total disponível</CardTitle>
          <CardValue>{formatBRL(totalBalance)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Receitas do mês (realizadas)</CardTitle>
          <CardValue className="text-teal-300">{formatBRL(incomeMonth)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Despesas do mês (realizadas)</CardTitle>
          <CardValue className="text-rose-300">{formatBRL(expenseMonth)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Orçamento pessoal restante</CardTitle>
          <CardValue>{budgetState ? formatBRL(budgetState.remainingCents) : '—'}</CardValue>
          {budgetState && (
            <p className="mt-1 text-xs text-slate-500">
              Disponível no mês: {formatBRL(budgetState.availableCents)} · Gasto:{' '}
              {formatBRL(budgetState.spentThisMonthCents)}
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardTitle>Contas a pagar (pendente)</CardTitle>
          <CardValue>{formatBRL(payablesStats.pendingPay)}</CardValue>
          <p className="mt-1 text-xs text-slate-500">
            {payablesStats.overdue} vencida(s) · {payablesStats.dueSoon} a vencer em 7 dias
          </p>
        </Card>
        <Card>
          <CardTitle>A receber (pendente)</CardTitle>
          <CardValue>{formatBRL(payablesStats.pendingRecv)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Meta de economia</CardTitle>
          {savings && savings.targetCents > 0 ? (
            <>
              <CardValue>{Math.round(savings.percent)}%</CardValue>
              <p className="mt-1 text-xs text-slate-500">
                Reservado {formatBRL(savings.reservedCents)} de {formatBRL(savings.targetCents)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-teal-500" style={{ width: `${savings.percent}%` }} />
              </div>
            </>
          ) : (
            <CardValue className="text-base">Defina em Metas</CardValue>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-72">
          <CardTitle>Receitas vs despesas (6 meses)</CardTitle>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartMonths}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip formatter={(v) => formatBRL(Math.round(Number(v ?? 0) * 100))} />
              <Legend />
              <Bar dataKey="receitas" fill="#2dd4bf" name="Receitas" />
              <Bar dataKey="despesas" fill="#fb7185" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-72">
          <CardTitle>Evolução (saldo líquido mensal)</CardTitle>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartMonths.map((c) => ({ ...c, liquido: c.receitas - c.despesas }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip formatter={(v) => formatBRL(Math.round(Number(v ?? 0) * 100))} />
              <Line type="monotone" dataKey="liquido" stroke="#38bdf8" name="Líquido" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Despesas fixas (previsão)</CardTitle>
          <p className="mt-2 text-lg font-semibold text-white">{formatBRL(fixedTotal)}/mês</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm text-slate-400">
            {fixedExpenses.map((f) => (
              <li key={f.id} className="flex justify-between">
                <span>{f.name}{f.paused ? ' (pausada)' : ''}</span>
                <span>{formatBRL(f.monthlyAmountCents)}</span>
              </li>
            ))}
          </ul>
        </Card>
        {card && (
          <Card>
            <CardTitle>{card.name}</CardTitle>
            <p className="mt-2 text-sm text-slate-400">
              Limite {formatBRL(card.limitCents)} · Disponível {formatBRL(limitAvailable)}
            </p>
            <p className="text-xs text-slate-500">
              Fechamento dia {card.closingDay} · Vencimento dia {card.dueDay}
            </p>
          </Card>
        )}
      </div>

      <QuickTransactionFab />
    </div>
  )
}
