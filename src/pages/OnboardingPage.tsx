import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Label } from '../components/ui/Input'
import { completeOnboarding } from '../data/financeStore'
import { DEFAULT_FIXED_EXPENSES, DEFAULT_INCOME_SOURCES, DEFAULT_PERSONAL_BUDGET_CENTS, DEFAULT_CREDIT_CARD } from '../domain/defaults'
import { formatBRL, parseBRLInput } from '../lib/money'
import { useFinance } from '../contexts/FinanceContext'
import { requestNotificationPermission } from '../services/notifications'

const steps = [
  'Boas-vindas',
  'Contas e saldos',
  'Orçamento e meta',
  'Referências',
  'Notificações',
  'Revisão',
]

export function OnboardingPage() {
  const { userId } = useAuth()
  const { profile, refresh } = useFinance()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('André')
  const [accountName, setAccountName] = useState('Conta principal')
  const [initialBalance, setInitialBalance] = useState('0,00')
  const [budget, setBudget] = useState('700,00')
  const [savings, setSavings] = useState('')
  const [notifications, setNotifications] = useState({
    dueAccounts: true,
    pendingIncome: true,
    budgetAlerts: true,
    weeklySummary: true,
  })
  const [busy, setBusy] = useState(false)

  if (profile?.onboardingCompleted) {
    return <Navigate to="/" replace />
  }

  const finish = async () => {
    setBusy(true)
    await completeOnboarding({
      userId,
      displayName,
      accounts: [
        {
          name: accountName,
          type: 'checking',
          initialBalanceCents: parseBRLInput(initialBalance),
        },
        { name: 'Dinheiro (espécie)', type: 'cash', initialBalanceCents: 0 },
      ],
      monthlyBudgetCents: parseBRLInput(budget) || DEFAULT_PERSONAL_BUDGET_CENTS,
      savingsTargetCents: savings ? parseBRLInput(savings) : 0,
      notifications,
    })
    await refresh()
    setBusy(false)
    navigate('/', { replace: true })
  }

  const next = async () => {
    if (step === 4) {
      await requestNotificationPermission()
    }
    if (step >= steps.length - 1) {
      await finish()
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div>
        <p className="text-sm text-teal-400">
          Passo {step + 1} de {steps.length}: {steps[step]}
        </p>
        <h1 className="text-2xl font-bold text-white">Configuração inicial</h1>
      </div>

      {step === 0 && (
        <Card>
          <p className="text-slate-300">
            Olá! Vamos configurar suas finanças pessoais. Nada aqui é lançado automaticamente como dinheiro
            recebido — apenas referências editáveis.
          </p>
          <div className="mt-4">
            <Label>Como podemos te chamar?</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3">
          <div>
            <Label>Nome da conta bancária principal</Label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>
          <div>
            <Label>Saldo inicial (R$)</Label>
            <Input value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} inputMode="decimal" />
          </div>
          <p className="text-xs text-slate-500">Você poderá cadastrar mais contas depois em Contas.</p>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-3">
          <div>
            <Label>Orçamento pessoal mensal (R$)</Label>
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} />
            <p className="mt-1 text-xs text-slate-400">Saldo não usado acumula para o mês seguinte.</p>
          </div>
          <div>
            <Label>Meta mensal de economia (R$) — opcional</Label>
            <Input value={savings} onChange={(e) => setSavings(e.target.value)} placeholder="Defina quando quiser" />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-white">Fontes de receita (referência)</h3>
            <ul className="mt-2 space-y-1 text-slate-400">
              {DEFAULT_INCOME_SOURCES.map((s) => (
                <li key={s.name}>
                  {s.name} — {s.referenceLabel}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-white">Despesas fixas (previsão mensal)</h3>
            <ul className="mt-2 space-y-1 text-slate-400">
              {DEFAULT_FIXED_EXPENSES.map((d) => (
                <li key={d.name}>
                  {d.name}: {formatBRL(d.monthlyAmountCents)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              Total referência:{' '}
              {formatBRL(DEFAULT_FIXED_EXPENSES.reduce((a, b) => a + b.monthlyAmountCents, 0))}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-white">Cartão</h3>
            <p className="text-slate-400">
              {DEFAULT_CREDIT_CARD.name} — limite ref. {formatBRL(DEFAULT_CREDIT_CARD.limitCents)}
            </p>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-3">
          {(
            [
              ['dueAccounts', 'Contas a vencer'],
              ['pendingIncome', 'Recebimentos pendentes'],
              ['budgetAlerts', 'Alertas de gastos'],
              ['weeklySummary', 'Resumo semanal'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600"
              />
              {label}
            </label>
          ))}
          <p className="text-xs text-slate-500">
            Notificações PWA quando o navegador permitir. Resumos dependem de você abrir o app ou de permissão
            local — sem serviços pagos.
          </p>
        </Card>
      )}

      {step === 5 && (
        <Card className="space-y-2 text-sm text-slate-300">
          <p>
            <strong className="text-white">Nome:</strong> {displayName}
          </p>
          <p>
            <strong className="text-white">Conta:</strong> {accountName} — saldo {formatBRL(parseBRLInput(initialBalance))}
          </p>
          <p>
            <strong className="text-white">Orçamento:</strong> {formatBRL(parseBRLInput(budget))}/mês
          </p>
          <p>
            <strong className="text-white">Meta economia:</strong>{' '}
            {savings ? formatBRL(parseBRLInput(savings)) : 'Não definida'}
          </p>
        </Card>
      )}

      <div className="flex justify-between gap-2">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Voltar
        </Button>
        <Button type="button" disabled={busy} onClick={() => void next()}>
          {step >= steps.length - 1 ? 'Concluir' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
