import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { FinanceProvider, useFinance } from './contexts/FinanceContext'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReceitasPage, DespesasPage, ContasPage } from './pages/GenericSectionPage'
import {
  CartoesPage,
  OrcamentoPage,
  MetasPage,
  RelatoriosPage,
  ConfiguracoesPage,
} from './pages/MorePages'

function BootGate({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth()
  const { profile, loading: finLoading } = useFinance()
  if (authLoading || finLoading) {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-400">
        Carregando…
      </div>
    )
  }
  if (!profile?.onboardingCompleted) {
    return <Navigate to="/configuracao-inicial" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/configuracao-inicial" element={<OnboardingPage />} />
      <Route
        element={
          <BootGate>
            <AppShell />
          </BootGate>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/receitas" element={<ReceitasPage />} />
        <Route path="/despesas" element={<DespesasPage />} />
        <Route path="/contas" element={<ContasPage />} />
        <Route path="/cartoes" element={<CartoesPage />} />
        <Route path="/orcamento" element={<OrcamentoPage />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FinanceProvider>
          <AppRoutes />
        </FinanceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
