import { useState } from 'react'
import { Button } from './ui/Button'
import { Input, Label } from './ui/Input'
import { parseBRLInput, formatBRL } from '../lib/money'
import { useFinance } from '../contexts/FinanceContext'

type Mode = 'income' | 'expense'

export function QuickTransactionFab() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const { accounts, categories, registerExpense, registerIncome, incomeSources } = useFinance()

  const accountId = accounts[0]?.id

  const submit = async () => {
    if (!accountId) return
    const cents = parseBRLInput(amount)
    if (cents <= 0) return
    if (mode === 'expense') {
      const cat = categories.find((c) => c.kind === 'expense')?.id ?? null
      await registerExpense(accountId, cents, description || 'Despesa rápida', cat)
    } else {
      await registerIncome(accountId, cents, description || 'Receita', incomeSources[0]?.id ?? null)
    }
    setAmount('')
    setDescription('')
    setOpen(false)
  }

  if (!accountId) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-40 rounded-full bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-teal-500 md:bottom-8 md:right-8"
      >
        + Lançamento rápido
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold text-white">Lançamento rápido</h2>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant={mode === 'expense' ? 'primary' : 'secondary'}
                onClick={() => setMode('expense')}
              >
                Despesa
              </Button>
              <Button
                type="button"
                variant={mode === 'income' ? 'primary' : 'secondary'}
                onClick={() => setMode('income')}
              >
                Receita
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" />
                {amount && <p className="mt-1 text-xs text-slate-400">{formatBRL(parseBRLInput(amount))}</p>}
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void submit()}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
