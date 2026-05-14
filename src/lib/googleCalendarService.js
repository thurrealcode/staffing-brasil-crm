import { supabase } from './supabase'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token ?? ''}`,
  }
}

// Retorna a URL de OAuth do Google para o usuário corrente
export async function getGoogleAuthUrl() {
  const headers = await authHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/google-auth-url`, { headers })
  if (!res.ok) throw new Error('Erro ao gerar URL de autorização')
  const { url } = await res.json()
  return url
}

// Verifica se o usuário corrente tem integração ativa
export async function checkGoogleIntegration() {
  const { data, error } = await supabase
    .from('google_integrations')
    .select('google_email, calendar_type, expires_at')
    .maybeSingle()
  if (error) return null
  return data
}

// Remove a integração do usuário corrente
export async function disconnectGoogleCalendar() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('google_integrations')
    .delete()
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}

// Remove um evento do Google Calendar pelo eventoId do CRM
export async function deleteEventoGoogleCalendar(eventoId) {
  try {
    const headers = await authHeaders()
    await fetch(`${FUNCTIONS_URL}/google-calendar-delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ eventoId }),
    })
  } catch {
    // Não bloqueia o fluxo principal se falhar
  }
}

// Sincroniza um evento da Agenda com o Google Calendar (fire-and-forget seguro)
export async function syncEventoGoogleCalendar(evento) {
  try {
    const headers = await authHeaders()
    await fetch(`${FUNCTIONS_URL}/google-calendar-sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventoId:         evento.id,
        responsavelEmail: evento.responsavelEmail ?? '',
        titulo:           evento.titulo,
        data:             evento.data,
        horario:          evento.horario,
        empresa:          evento.empresa,
        contato:          evento.contato,
        local:            evento.local,
        observacoes:      evento.observacoes,
        tipo:             evento.tipo,
        participantes:    evento.participantes  ?? '',
      }),
    })
  } catch {
    // Não bloqueia o fluxo principal se a sync falhar
  }
}
