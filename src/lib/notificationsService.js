import { supabase } from './supabase'

// Busca IDs de todos os admins para notificar
async function getAdminIds() {
  const { data } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin')
  return (data || []).map(p => p.user_id)
}

// Cria notificações para todos os admins (excluindo o próprio criador)
export async function notifyAdmins({ type, content, link, excludeUserId }) {
  const adminIds = await getAdminIds()
  const targets = adminIds.filter(id => id !== excludeUserId)
  if (targets.length === 0) return
  await supabase.from('notifications').insert(
    targets.map(user_id => ({ user_id, type, content, link }))
  )
}

// Cria notificação para um usuário específico
export async function notifyUser({ userId, type, content, link }) {
  await supabase.from('notifications').insert({ user_id: userId, type, content, link })
}
