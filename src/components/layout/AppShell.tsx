import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Landmark,
  CreditCard,
  PiggyBank,
  Target,
  BarChart3,
  Settings,
  Wallet,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useFinance } from '../../contexts/FinanceContext'
import { useAuth } from '../../contexts/AuthContext'

const nav = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/receitas', label: 'Receitas', icon: TrendingUp },
  { to: '/despesas', label: 'Despesas', icon: TrendingDown },
  { to: '/contas', label: 'Contas', icon: Landmark },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/orcamento', label: 'Orçamento', icon: Wallet },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Config.', icon: Settings },
]

export function AppShell() {
  const { pendingSync } = useFinance()
  const { isLocalMode } = useAuth()

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-slate-800 md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-4 py-4 md:flex-col md:items-start">
          <PiggyBank className="h-8 w-8 text-teal-400" />
          <div>
            <p className="font-semibold text-white">Meu Financeiro</p>
            <p className="text-xs text-slate-400">
              {isLocalMode ? 'Modo local (dados neste dispositivo)' : 'Sincronizado na nuvem'}
              {!isLocalMode && pendingSync > 0 ? ` · ${pendingSync} pendente(s)` : ''}
            </p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800',
                  isActive && 'bg-teal-900/40 text-teal-200',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
