import { supabase } from './supabase'

export async function registrarCancelamento({ titulo, tipo = 'agenda', motivo }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const nome = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || ''

  await supabase.from('cancelamentos').insert({
    user_id:              user.id,
    tipo,
    titulo,
    motivo,
    cancelado_por_nome:  nome,
    cancelado_por_email: user.email || '',
  })
}

export async function fetchCancelamentos() {
  const { data, error } = await supabase
    .from('cancelamentos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}
