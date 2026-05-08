import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Send, MessageSquare, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function initials(nome) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function Avatar({ nome, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#ef4444' }}>{initials(nome)}</span>
    </div>
  )
}

function ConvItem({ c, active, onClick, isGroup }) {
  return (
    <div onClick={onClick}
      style={{
        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1c1c20',
        background: active ? 'rgba(239,68,68,0.06)' : 'transparent',
        borderLeft: active ? '2px solid #ef4444' : '2px solid transparent',
        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {isGroup ? (
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Users size={16} style={{ color: '#ef4444' }} />
        </div>
      ) : (
        <Avatar nome={c.nome} size={38} />
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
        <div style={{ fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isGroup ? 'Todos os membros' : c.email}
        </div>
      </div>
    </div>
  )
}

const GROUP_CONV = { type: 'group', id: 'group', nome: 'Grupo Geral' }

export default function Mensagens() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [conv, setConv] = useState(GROUP_CONV)
  const [messages, setMessages] = useState([])
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const convRef = useRef(conv)
  const endRef = useRef(null)

  useEffect(() => { convRef.current = conv }, [conv])

  // Fetch all other users for DM list
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('user_id, nome, email')
      .neq('user_id', user.id)
      .order('nome')
      .then(({ data }) => setUsers(data || []))
  }, [user])

  // Fetch messages for current conversation
  const fetchMessages = useCallback(async (c) => {
    if (!user) return
    setLoading(true)
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (c.type === 'group') {
      query = query.is('recipient_id', null)
    } else {
      query = query.or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${c.id}),and(sender_id.eq.${c.id},recipient_id.eq.${user.id})`
      )
    }
    const { data } = await query
    setMessages(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchMessages(conv) }, [conv, fetchMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new
        const c = convRef.current
        const isGroup = c.type === 'group' && msg.recipient_id === null
        const isDM = c.type === 'dm' && (
          (msg.sender_id === user.id && msg.recipient_id === c.id) ||
          (msg.sender_id === c.id && msg.recipient_id === user.id)
        )
        if (isGroup || isDM) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const enviar = async () => {
    if (!texto.trim() || !user || sending) return
    setSending(true)
    const senderNome = user.name || user.email?.split('@')[0] || 'Usuário'
    await supabase.from('messages').insert({
      sender_id: user.id,
      sender_nome: senderNome,
      recipient_id: conv.type === 'dm' ? conv.id : null,
      content: texto.trim(),
    })
    setTexto('')
    setSending(false)
  }

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const filteredUsers = users.filter(u =>
    !busca || u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', background: '#111113', border: '1px solid #1c1c20', borderRadius: 16, overflow: 'hidden' }}>

      {/* Left sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #1c1c20', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #1c1c20' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', marginBottom: 12 }}>Mensagens</h2>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar usuário..."
              style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', color: '#fafafa', padding: '8px 10px 8px 30px', borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ConvItem c={GROUP_CONV} active={conv.id === 'group'} onClick={() => setConv(GROUP_CONV)} isGroup />

          {filteredUsers.length > 0 && (
            <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Mensagens Diretas
            </div>
          )}
          {filteredUsers.map(u => {
            const c = { type: 'dm', id: u.user_id, nome: u.nome, email: u.email }
            return (
              <ConvItem key={u.user_id} c={c} active={conv.id === u.user_id} onClick={() => setConv(c)} />
            )
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c20', display: 'flex', alignItems: 'center', gap: 12 }}>
          {conv.type === 'group' ? (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} style={{ color: '#ef4444' }} />
            </div>
          ) : (
            <Avatar nome={conv.nome} size={40} />
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{conv.nome}</div>
            <div style={{ fontSize: 12, color: '#52525b' }}>
              {conv.type === 'group' ? 'Canal público — todos os membros' : conv.email}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#52525b', fontSize: 13 }}>Carregando mensagens...</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: 13, color: '#52525b' }}>Nenhuma mensagem ainda.</div>
              <div style={{ fontSize: 12, color: '#3f3f46' }}>Seja o primeiro a escrever!</div>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user?.id
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && conv.type === 'group' && (
                    <span style={{ fontSize: 11, color: '#71717a', marginBottom: 3, marginLeft: 2 }}>{m.sender_nome}</span>
                  )}
                  <div style={{
                    maxWidth: '68%', padding: '10px 14px',
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMe ? 'rgba(239,68,68,0.15)' : '#18181b',
                    border: isMe ? '1px solid rgba(239,68,68,0.2)' : '1px solid #27272a',
                  }}>
                    <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.55 }}>{m.content}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#52525b' }}>{formatTime(m.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1c1c20', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
            placeholder={conv.type === 'group' ? 'Mensagem para o Grupo Geral...' : `Mensagem para ${conv.nome}...`}
            style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', color: '#fafafa', padding: '10px 14px', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#ef4444'}
            onBlur={e => e.target.style.borderColor = '#27272a'}
          />
          <button onClick={enviar} disabled={sending || !texto.trim()} className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, opacity: sending || !texto.trim() ? 0.5 : 1 }}>
            <Send size={14} /> Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
