import { useFinance } from '../contexts/FinanceContext'
import { Card, CardTitle } from '../components/ui/Card'
import { formatBRL } from '../lib/money'
import { calculateAccountBalance } from '../domain/balances'
import type { ReactNode } from 'react'

export function SectionShell({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-400">{description}</p>
      </header>
      {children}
    </div>
  )
}

export function ReceitasPage() {
  const { incomeSources, movements } = useFinance()
  const realized = movements.filter((m) => m.kind === 'income' && m.status === 'confirmed')

  return (
    <SectionShell
      title="Receitas"
      description="Previsões editáveis e receitas só entram quando confirmadas na conta ou em espécie."
    >
      <Card>
        <CardTitle>Fontes cadastradas</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {incomeSources.map((s) => (
            <li key={s.id} className="flex flex-col rounded-xl bg-slate-950/50 p-3 sm:flex-row sm:justify-between">
              <div>
                <p className="font-medium text-white">{s.name}</p>
                <p className="text-slate-400">{s.referenceLabel}</p>
              </div>
              {s.referenceAmountCents != null && (
                <p className="text-teal-300">Ref. {formatBRL(s.referenceAmountCents)}</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Receitas realizadas</CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {realized.length === 0 && <li>Nenhuma receita confirmada ainda. Use o lançamento rápido.</li>}
          {realized.map((m) => (
            <li key={m.id} className="flex justify-between border-b border-slate-800 py-2">
              <span>{m.description}</span>
              <span className="text-teal-300">{formatBRL(m.amountCents)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </SectionShell>
  )
}

export function DespesasPage() {
  const { fixedExpenses, movements } = useFinance()
  const realized = movements.filter((m) => m.kind === 'expense' && m.status === 'confirmed')

  return (
    <SectionShell title="Despesas" description="Fixas são previsões; pagamentos reais são lançamentos confirmados.">
      <Card>
        <CardTitle>Despesas fixas (referência)</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {fixedExpenses.map((f) => (
            <li key={f.id} className="flex justify-between rounded-lg px-2 py-1 hover:bg-slate-800/50">
              <span className={f.paused ? 'text-slate-500 line-through' : 'text-slate-200'}>{f.name}</span>
              <span>{formatBRL(f.monthlyAmountCents)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Pagamentos realizados</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {realized.map((m) => (
            <li key={m.id} className="flex justify-between py-1">
              <span>{m.description}</span>
              <span className="text-rose-300">-{formatBRL(m.amountCents)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </SectionShell>
  )
}

export function ContasPage() {
  const { accounts, movements } = useFinance()

  return (
    <SectionShell title="Contas" description="Contas bancárias, carteira e histórico de saldos.">
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.id}>
            <CardTitle>{a.name}</CardTitle>
            <p className="mt-2 text-xl font-semibold text-white">
              {formatBRL(calculateAccountBalance(a, movements))}
            </p>
            <p className="text-xs capitalize text-slate-500">{a.type}</p>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}
