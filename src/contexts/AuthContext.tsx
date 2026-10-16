import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../data/supabaseClient'
import { LOCAL_DEMO_USER, ensureLocalProfile } from '../data/financeStore'

interface AuthContextValue {
  user: User | null
  userId: string
  session: Session | null
  loading: boolean
  isLocalMode: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isLocalMode = !isSupabaseConfigured

  useEffect(() => {
    if (!supabase) {
      void ensureLocalProfile(LOCAL_DEMO_USER).finally(() => setLoading(false))
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? LOCAL_DEMO_USER

  useEffect(() => {
    void ensureLocalProfile(userId)
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Modo local: configure o Supabase para login na nuvem.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Modo local: configure o Supabase para criar conta.' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      userId,
      session,
      loading,
      isLocalMode,
      signIn,
      signUp,
      signOut,
    }),
    [session, userId, loading, isLocalMode, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
