import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useFinance } from '../contexts/FinanceContext'

export function LoginPage() {
  const { signIn, signUp, isLocalMode, loading: authLoading } = useAuth()
  const { profile, loading: finLoading } = useFinance()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!authLoading && !finLoading && profile?.onboardingCompleted) {
    return <Navigate to="/" replace />
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    const fn = mode === 'login' ? signIn : signUp
    const res = await fn(email, password)
    if (res.error) setError(res.error)
    setBusy(false)
  }

  if (isLocalMode) {
    return <Navigate to="/configuracao-inicial" replace />
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold text-white">Entrar no Meu Financeiro</h1>
        <p className="mt-1 text-sm text-slate-400">Use sua conta Supabase para sincronizar entre dispositivos.</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button className="w-full" disabled={busy} onClick={() => void submit()}>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-teal-400"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Criar uma conta' : 'Já tenho conta'}
          </button>
          <Link to="/configuracao-inicial" className="block text-center text-xs text-slate-500">
            Continuar em modo local (sem nuvem)
          </Link>
        </div>
      </Card>
    </div>
  )
}
