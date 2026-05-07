import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e ANON KEY são obrigatórios. Verifique o arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'staffing_brasil_session',
  },
})

// Mapeia o objeto de usuário do Supabase para o formato esperado pela aplicação
export function mapSupabaseUser(supabaseUser) {
  if (!supabaseUser) return null
  const name = supabaseUser.user_metadata?.name
    || supabaseUser.user_metadata?.full_name
    || supabaseUser.email?.split('@')[0]
    || 'Usuário'
  const role = supabaseUser.user_metadata?.role || 'Consultor'
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name,
    role,
    avatar: initials,
  }
}
