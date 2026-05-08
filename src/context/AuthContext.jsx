import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, mapSupabaseUser } from '../lib/supabase'

const AuthContext = createContext(null)

async function fetchProfileRole(userId) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    return data?.role || 'comercial'
  } catch {
    return 'comercial'
  }
}

async function buildUser(supabaseUser) {
  if (!supabaseUser) return null
  const mapped = mapSupabaseUser(supabaseUser)
  const role   = await fetchProfileRole(supabaseUser.id)
  return { ...mapped, role }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)

  useEffect(() => {
    // Recupera sessão existente ao montar
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) setSessionError(error.message)
      setUser(await buildUser(session?.user ?? null))
      setLoading(false)
    })

    // Escuta mudanças de sessão (login, logout — ignora refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return
      setUser(await buildUser(session?.user ?? null))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Login com email e senha
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateError(error.message))
    return mapSupabaseUser(data.user)
  }

  // Cadastro de novo usuário
  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: 'Consultor',
        },
      },
    })
    if (error) throw new Error(translateError(error.message))
    // Se confirmação de email não for necessária, o usuário já está logado
    // Se for necessária, data.user existe mas session é null
    return { user: data.user, needsConfirmation: !data.session }
  }

  // Reenviar email de confirmação
  const resendConfirmation = async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw new Error(translateError(error.message))
  }

  // Recuperação de senha
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw new Error(translateError(error.message))
  }

  // Logout
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      sessionError,
      login,
      register,
      logout,
      resetPassword,
      resendConfirmation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// Traduz mensagens de erro do Supabase para português
function translateError(msg) {
  const map = {
    'Invalid login credentials': 'Email ou senha incorretos.',
    'Email not confirmed': 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.',
    'User already registered': 'Este email já está cadastrado. Faça login.',
    'Password should be at least 6 characters': 'A senha deve ter ao menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de email inválido.',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
    'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'signup requires a valid password': 'Digite uma senha válida.',
    'invalid_credentials': 'Email ou senha incorretos.',
    'email_not_confirmed': 'Confirme seu email antes de entrar.',
  }
  // Busca correspondência parcial
  const key = Object.keys(map).find(k => msg.toLowerCase().includes(k.toLowerCase()))
  return key ? map[key] : msg
}
