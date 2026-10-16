import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { addMovement, addQuickExpense, loadFinanceState } from '../data/financeStore'
import { getPendingSyncCount, setupOnlineSync } from '../data/syncEngine'
import type { Account, Movement, PayableReceivable } from '../domain/types'
import type { LocalFixedExpense, LocalIncomeSource, LocalPersonalBudget, LocalProfile, LocalSavingsGoal, LocalCategory } from '../data/localDb'
import type { CreditCard, CreditInvoice, CreditPurchase } from '../domain/types'

type FinanceState = {
  profile: LocalProfile | undefined
  accounts: Account[]
  movements: Movement[]
  incomeSources: LocalIncomeSource[]
  fixedExpenses: LocalFixedExpense[]
  personalBudget: LocalPersonalBudget | undefined
  savingsGoal: LocalSavingsGoal | undefined
  creditCards: CreditCard[]
  creditInvoices: CreditInvoice[]
  creditPurchases: CreditPurchase[]
  payables: PayableReceivable[]
  categories: LocalCategory[]
}

interface FinanceContextValue extends FinanceState {
  loading: boolean
  pendingSync: number
  refresh: () => Promise<void>
  registerExpense: (accountId: string, amountCents: number, description: string, categoryId: string | null) => Promise<void>
  registerIncome: (accountId: string, amountCents: number, description: string, incomeSourceId: string | null) => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

const empty: FinanceState = {
  profile: undefined,
  accounts: [],
  movements: [],
  incomeSources: [],
  fixedExpenses: [],
  personalBudget: undefined,
  savingsGoal: undefined,
  creditCards: [],
  creditInvoices: [],
  creditPurchases: [],
  payables: [],
  categories: [],
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [state, setState] = useState<FinanceState>(empty)
  const [loading, setLoading] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)

  const refresh = useCallback(async () => {
    const data = await loadFinanceState(userId)
    setState(data as FinanceState)
    setPendingSync(await getPendingSyncCount())
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    return setupOnlineSync(userId, setPendingSync)
  }, [userId])

  const registerExpense = useCallback(
    async (accountId: string, amountCents: number, description: string, categoryId: string | null) => {
      await addQuickExpense(userId, accountId, amountCents, description, categoryId)
      await refresh()
    },
    [userId, refresh],
  )

  const registerIncome = useCallback(
    async (accountId: string, amountCents: number, description: string, incomeSourceId: string | null) => {
      await addMovement(userId, {
        accountId,
        creditCardId: null,
        kind: 'income',
        amountCents,
        occurredAt: new Date().toISOString(),
        categoryId: null,
        incomeSourceId,
        description,
        paymentMethod: 'pix',
        status: 'confirmed',
        notes: null,
        transferGroupId: null,
        creditInvoiceId: null,
        payableReceivableId: null,
        deletedAt: null,
      })
      await refresh()
    },
    [userId, refresh],
  )

  const value = useMemo(
    () => ({
      ...state,
      loading,
      pendingSync,
      refresh,
      registerExpense,
      registerIncome,
    }),
    [state, loading, pendingSync, refresh, registerExpense, registerIncome],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance fora do FinanceProvider')
  return ctx
}
