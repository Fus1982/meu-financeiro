import { useFinance } from '../contexts/FinanceContext'
import { Card, CardTitle } from '../components/ui/Card'
import { formatBRL } from '../lib/money'
import { computePersonalBudgetState, currentMonthKey } from '../domain/budget'
import { savingsGoalProgress } from '../domain/savings'
import { creditAvailableLimit } from '../domain/creditCard'
import { pendingBalance, derivePayableStatus } from '../domain/payables'
import { SectionShell } from './GenericSectionPage'
import { useAuth } from '../contexts/AuthContext'
import { exportUserDataJson } from '../data/financeStore'
import { Button } from '../components/ui/Button'
import { requestNotificationPermission } from '../services/notifications'

export function CartoesPage() {
  const { creditCards, creditPurchases, creditInvoices } = useFinance()
  return (
    <SectionShell title="Cartões" description="Compras reconhecem despesa; pagamento de fatura não duplica.">
      {creditCards.map((c) => (
        <Card key={c.id}>
          <CardTitle>{c.name}</CardTitle>
          <p className="mt-2 text-white">
            Limite {formatBRL(c.limitCents)} · Disponível{' '}
            {formatBRL(creditAvailableLimit(c, creditPurchases, creditInvoices))}
          </p>
          <p className="text-xs text-slate-500">
            Fechamento {c.closingDay} · Vencimento {c.dueDay}
          </p>
        </Card>
      ))}
    </SectionShell>
  )
}

export function OrcamentoPage() {
  const { personalBudget, movements } = useFinance()
  const state =
    personalBudget &&
    computePersonalBudgetState(
      {
        monthlyLimitCents: personalBudget.monthlyLimitCents,
        startMonth: personalBudget.startMonth,
        openingAccumulatedCents: personalBudget.openingAccumulatedCents,
      },
      movements,
      currentMonthKey(),
    )
  return (
    <SectionShell
      title="Orçamento pessoal"
      description="Separado do saldo bancário e da meta de economia. Saldo não usado acumula."
    >
      {state && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardTitle>Limite mensal</CardTitle>
            <p className="mt-2 text-xl text-white">{formatBRL(state.monthlyLimitCents)}</p>
          </Card>
          <Card>
            <CardTitle>Acumulado de meses anteriores</CardTitle>
            <p className="mt-2 text-xl text-white">{formatBRL(state.accumulatedBeforeMonthCents)}</p>
          </Card>
          <Card>
            <CardTitle>Disponível neste mês</CardTitle>
            <p className="mt-2 text-xl text-teal-300">{formatBRL(state.availableCents)}</p>
          </Card>
          <Card>
            <CardTitle>Restante</CardTitle>
            <p className="mt-2 text-xl text-white">{formatBRL(state.remainingCents)}</p>
          </Card>
        </div>
      )}
    </SectionShell>
  )
}

export function MetasPage() {
  const { savingsGoal, movements } = useFinance()
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const progress =
    savingsGoal &&
    savingsGoalProgress({ monthlyTargetCents: savingsGoal.monthlyTargetCents }, movements, start, end)
  return (
    <SectionShell title="Metas de economia" description="Reserva contábil via movimentações savings_deposit.">
      {progress && progress.targetCents > 0 ? (
        <Card>
          <CardTitle>Meta do mês</CardTitle>
          <p className="mt-2 text-2xl text-white">{formatBRL(progress.targetCents)}</p>
          <p className="mt-2 text-sm text-slate-400">
            Reservado {formatBRL(progress.reservedCents)} · Falta {formatBRL(progress.remainingCents)}
          </p>
        </Card>
      ) : (
        <Card>
          <p className="text-slate-300">Configure sua meta mensal em Configurações ou refaça a configuração inicial.</p>
        </Card>
      )}
    </SectionShell>
  )
}

export function RelatoriosPage() {
  const { movements } = useFinance()
  const income = movements.filter((m) => m.kind === 'income').length
  const expense = movements.filter((m) => m.kind === 'expense').length
  return (
    <SectionShell title="Relatórios" description="Visão consolidada; gráficos detalhados no Início.">
      <Card>
        <p className="text-slate-300">
          Lançamentos registrados: {movements.length} ({income} receitas · {expense} despesas)
        </p>
      </Card>
    </SectionShell>
  )
}

export function ConfiguracoesPage() {
  const { userId, isLocalMode, signOut } = useAuth()
  const { profile, payables } = useFinance()

  const downloadExport = async () => {
    const json = await exportUserDataJson(userId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meu-financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <SectionShell title="Configurações" description="Conta, notificações, backup e sincronização.">
      <Card className="space-y-2 text-sm text-slate-300">
        <p>
          Modo: <strong className="text-white">{isLocalMode ? 'Local (IndexedDB)' : 'Supabase'}</strong>
        </p>
        <p>Nome: {profile?.displayName}</p>
      </Card>
      <Card className="space-y-3">
        <CardTitle>Notificações</CardTitle>
        <Button type="button" variant="secondary" onClick={() => void requestNotificationPermission()}>
          Solicitar permissão PWA
        </Button>
      </Card>
      <Card className="space-y-3">
        <CardTitle>Backup</CardTitle>
        <Button type="button" onClick={() => void downloadExport()}>
          Exportar dados (JSON)
        </Button>
      </Card>
      {!isLocalMode && (
        <Button type="button" variant="ghost" onClick={() => void signOut()}>
          Sair
        </Button>
      )}
      <Card>
        <CardTitle>Contas a pagar / receber</CardTitle>
        <ul className="mt-2 space-y-1 text-sm">
          {payables.length === 0 && <li className="text-slate-500">Nenhum título cadastrado ainda.</li>}
          {payables.map((p) => (
            <li key={p.id} className="flex justify-between">
              <span>{p.title}</span>
              <span>{formatBRL(pendingBalance(p))} · {derivePayableStatus(p)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </SectionShell>
  )
}
