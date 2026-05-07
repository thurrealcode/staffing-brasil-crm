import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Send, Phone, Mail, MessageSquare, MoreVertical, Paperclip, Smile, Clock, CheckCheck } from 'lucide-react'

const CONVERSATIONS = [
  { id: 1, nome: 'Ricardo Oliveira', empresa: 'TechCorp Brasil', avatar: 'RO', ultima: 'Podemos marcar para quinta às 10h?', hora: '10:32', nao_lida: 2, online: true, tipo: 'whatsapp' },
  { id: 2, nome: 'Fernanda Costa', empresa: 'Grupo Logística MAX', avatar: 'FC', ultima: 'Recebi a proposta, vou analisar.', hora: '09:15', nao_lida: 0, online: false, tipo: 'email' },
  { id: 3, nome: 'Carlos Drummond', empresa: 'Banco Meridional', avatar: 'CD', ultima: 'Precisamos de mais 3 vagas de...', hora: 'Ontem', nao_lida: 1, online: false, tipo: 'whatsapp' },
  { id: 4, nome: 'Marina Santos', empresa: 'Construtora Horizonte', avatar: 'MS', ultima: 'Contrato assinado! Obrigada.', hora: 'Seg', nao_lida: 0, online: true, tipo: 'email' },
  { id: 5, nome: 'Lucas Ferreira', empresa: 'Candidato', avatar: 'LF', ultima: 'Confirmo presença na entrevista.', hora: 'Dom', nao_lida: 0, online: false, tipo: 'whatsapp' },
  { id: 6, nome: 'Ana Lima', empresa: 'Varejo Express', avatar: 'AL', ultima: 'Quando vocês podem vir até nós?', hora: 'Sáb', nao_lida: 0, online: false, tipo: 'email' },
]

const MESSAGES = {
  1: [
    { id: 1, de: 'outro', texto: 'Bom dia! Tivemos uma reunião interna e gostaríamos de avançar com o processo.', hora: '09:45', lida: true },
    { id: 2, de: 'eu', texto: 'Ótimo! Que bom saber disso. Podemos agendar uma reunião para apresentar os candidatos selecionados.', hora: '09:52', lida: true },
    { id: 3, de: 'outro', texto: 'Perfeito! Tenho disponibilidade na quinta e sexta desta semana.', hora: '10:05', lida: true },
    { id: 4, de: 'eu', texto: 'Quinta às 10h está ótimo para nós! Vou enviar o convite pelo Google Meet.', hora: '10:18', lida: true },
    { id: 5, de: 'outro', texto: 'Podemos marcar para quinta às 10h?', hora: '10:32', lida: false },
  ],
  3: [
    { id: 1, de: 'outro', texto: 'Precisamos de mais 3 vagas de analista de compliance para o segundo semestre.', hora: 'Ontem 14:22', lida: false },
  ],
}

const TIPO_CONFIG = {
  whatsapp: { color: '#22c55e', label: 'WhatsApp' },
  email: { color: '#3b82f6', label: 'E-mail' },
}

function Avatar({ nome, size = 36, color = '#ef4444' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `rgba(239,68,68,0.12)`, border: `1px solid rgba(239,68,68,0.2)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#ef4444' }}>{nome}</span>
    </div>
  )
}

export default function Mensagens() {
  const [conversa, setConversa] = useState(CONVERSATIONS[0])
  const [msgs, setMsgs] = useState(MESSAGES)
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')

  const filtradas = CONVERSATIONS.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.empresa.toLowerCase().includes(busca.toLowerCase())
  )

  const mensagensAtuais = msgs[conversa.id] || []

  const enviar = () => {
    if (!texto.trim()) return
    const nova = { id: Date.now(), de: 'eu', texto: texto.trim(), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), lida: true }
    setMsgs(m => ({ ...m, [conversa.id]: [...(m[conversa.id] || []), nova] }))
    setTexto('')
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', background: '#111113', border: '1px solid #1c1c20', borderRadius: 16, overflow: 'hidden' }}>

      {/* Sidebar de conversas */}
      <div style={{ width: 320, borderRight: '1px solid #1c1c20', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #1c1c20' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>Mensagens</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 11, color: '#52525b' }}>3 não lidas</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar conversa..."
              style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', color: '#fafafa', padding: '8px 10px 8px 30px', borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtradas.map(c => (
            <div key={c.id} onClick={() => setConversa(c)}
              style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #1c1c20',
                background: conversa.id === c.id ? 'rgba(239,68,68,0.06)' : 'transparent',
                borderLeft: conversa.id === c.id ? '2px solid #ef4444' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (conversa.id !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (conversa.id !== c.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar nome={c.avatar} size={38} />
                  {c.online && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #111113' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                    <span style={{ fontSize: 10, color: '#52525b', flexShrink: 0, marginLeft: 4 }}>{c.hora}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a', marginBottom: 4 }}>{c.empresa}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.ultima}</span>
                    {c.nao_lida > 0 && (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{c.nao_lida}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header do chat */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c20', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Avatar nome={conversa.avatar} size={40} />
              {conversa.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #111113' }} />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa' }}>{conversa.nome}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#52525b' }}>{conversa.empresa}</span>
                <span style={{ width: 1, height: 10, background: '#27272a' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: TIPO_CONFIG[conversa.tipo].color }} />
                  <span style={{ fontSize: 11, color: '#52525b' }}>{TIPO_CONFIG[conversa.tipo].label}</span>
                </div>
                {conversa.online && <span style={{ fontSize: 11, color: '#22c55e' }}>• online</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[Phone, Mail, MoreVertical].map((Icon, i) => (
              <button key={i} style={{ width: 34, height: 34, background: '#18181b', border: '1px solid #27272a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#71717a', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fafafa'; e.currentTarget.style.borderColor = '#3f3f46' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = '#27272a' }}>
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mensagensAtuais.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: 13, color: '#52525b' }}>Nenhuma mensagem ainda.</div>
              <div style={{ fontSize: 12, color: '#3f3f46' }}>Inicie a conversa abaixo.</div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {mensagensAtuais.map((m, i) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', justifyContent: m.de === 'eu' ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{
                    maxWidth: '68%', padding: '10px 14px', borderRadius: m.de === 'eu' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.de === 'eu' ? 'rgba(239,68,68,0.15)' : '#18181b',
                    border: m.de === 'eu' ? '1px solid rgba(239,68,68,0.2)' : '1px solid #27272a',
                  }}>
                    <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.5 }}>{m.texto}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                      <Clock size={9} style={{ color: '#52525b' }} />
                      <span style={{ fontSize: 10, color: '#52525b' }}>{m.hora}</span>
                      {m.de === 'eu' && <CheckCheck size={11} style={{ color: m.lida ? '#3b82f6' : '#52525b' }} />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1c1c20', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button style={{ width: 34, height: 34, background: '#18181b', border: '1px solid #27272a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#52525b', flexShrink: 0 }}>
            <Paperclip size={14} />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input value={texto} onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder={`Mensagem para ${conversa.nome}...`}
              style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', color: '#fafafa', padding: '10px 40px 10px 14px', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#ef4444'}
              onBlur={e => e.target.style.borderColor = '#27272a'}
            />
            <button style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex' }}>
              <Smile size={15} />
            </button>
          </div>
          <button onClick={enviar} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>
            <Send size={14} /> Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
