import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Lock, Bell, Palette, Globe, Users, Shield, Plug, Trash2,
  Check, Eye, EyeOff, ChevronRight, Building2, Mail, Phone, MapPin, Save,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const MENU_ITEMS = [
  { id: 'perfil', label: 'Meu Perfil', icon: User },
  { id: 'seguranca', label: 'Segurança', icon: Lock },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2 },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'integrações', label: 'Integrações', icon: Plug },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'privacidade', label: 'Privacidade & LGPD', icon: Shield },
]

const ROLE_OPTIONS = [
  { value: 'admin',        label: 'Administrador' },
  { value: 'comercial',    label: 'Comercial'     },
  { value: 'recrutamento', label: 'Recrutamento'  },
]

function roleLabel(role) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label || role
}

function avatarFromNome(nome) {
  return (nome || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

const INTEGRACOES = [
  { id: 'whatsapp', nome: 'WhatsApp Business', desc: 'Envie mensagens direto do CRM', conectado: true, color: '#22c55e' },
  { id: 'gmail', nome: 'Gmail / Google Workspace', desc: 'Sincronize e-mails automaticamente', conectado: true, color: '#ef4444' },
  { id: 'calendar', nome: 'Google Calendar', desc: 'Sincronize reuniões e compromissos', conectado: false, color: '#3b82f6' },
  { id: 'linkedin', nome: 'LinkedIn Recruiter', desc: 'Importe candidatos do LinkedIn', conectado: false, color: '#0077b5' },
  { id: 'slack', nome: 'Slack', desc: 'Notificações em tempo real no Slack', conectado: false, color: '#4a154b' },
]

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: '#52525b' }}>{subtitle}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? '#ef4444' : '#27272a', transition: 'background 0.2s', position: 'relative', flexShrink: 0,
        boxShadow: checked ? '0 0 12px rgba(239,68,68,0.3)' : 'none',
      }}>
      <motion.div animate={{ x: checked ? 22 : 2 }} transition={{ duration: 0.2 }}
        style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2 }} />
    </button>
  )
}

function FieldRow({ label, sublabel, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1c1c20' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#e4e4e7' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>{sublabel}</div>}
      </div>
      {children}
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', icon: Icon }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="input-premium" style={{ paddingLeft: Icon ? 36 : 14, fontSize: 13 }} />
      </div>
    </div>
  )
}

// ---- Seções ----

function SecaoPerfil({ user }) {
  const [nome, setNome] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [tel, setTel] = useState('(11) 99999-9999')
  const [cargo, setCargo] = useState(user?.role || '')
  const [saved, setSaved] = useState(false)

  const salvar = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <SectionTitle title="Meu Perfil" subtitle="Gerencie suas informações pessoais e profissionais" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: 20, background: '#18181b', border: '1px solid #27272a', borderRadius: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{user?.avatar || 'SB'}</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 8 }}>{user?.email}</div>
          <button className="btn-secondary" style={{ fontSize: 11, padding: '5px 12px' }}>Alterar foto</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <InputField label="Nome completo" value={nome} onChange={setNome} icon={User} />
        <InputField label="E-mail" value={email} onChange={setEmail} type="email" icon={Mail} />
        <InputField label="Telefone" value={tel} onChange={setTel} icon={Phone} />
        <InputField label="Cargo" value={cargo} onChange={setCargo} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={salvar} className="btn-primary" style={{ fontSize: 13 }}>
          {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar alterações</>}
        </button>
      </div>
    </div>
  )
}

function SecaoSeguranca() {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [show, setShow] = useState({ atual: false, nova: false, confirma: false })
  const [a2f, setA2f] = useState(false)
  const [sessoes, setSessoes] = useState(true)

  return (
    <div>
      <SectionTitle title="Segurança" subtitle="Gerencie sua senha e configurações de acesso" />
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 16 }}>Alterar Senha</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Senha atual', val: atual, set: setAtual, key: 'atual' },
            { label: 'Nova senha', val: nova, set: setNova, key: 'nova' },
            { label: 'Confirmar nova senha', val: confirma, set: setConfirma, key: 'confirma' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#71717a', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
                <input type={show[f.key] ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)}
                  className="input-premium" style={{ paddingLeft: 36, paddingRight: 36, fontSize: 13 }} />
                <button onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52525b' }}>
                  {show[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" style={{ fontSize: 13 }}><Save size={14} /> Atualizar senha</button>
        </div>
      </div>
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 4 }}>Acesso e Sessão</div>
        <FieldRow label="Autenticação em 2 fatores" sublabel="Adiciona uma camada extra de segurança ao seu login">
          <Toggle checked={a2f} onChange={setA2f} />
        </FieldRow>
        <FieldRow label="Encerrar sessões inativas" sublabel="Desconectar automaticamente após 30 minutos sem atividade">
          <Toggle checked={sessoes} onChange={setSessoes} />
        </FieldRow>
      </div>
    </div>
  )
}

function SecaoNotificacoes() {
  const [notifs, setNotifs] = useState({
    novoLead: true, reuniao: true, proposta: true, contratacao: true,
    email: true, whatsapp: false, relatorio: true, sistema: false,
  })

  const toggle = k => setNotifs(n => ({ ...n, [k]: !n[k] }))

  const grupos = [
    {
      titulo: 'Eventos do CRM',
      items: [
        { key: 'novoLead', label: 'Novo lead adicionado', sub: 'Quando um lead for criado no sistema' },
        { key: 'reuniao', label: 'Lembretes de reunião', sub: '30 minutos antes do evento agendado' },
        { key: 'proposta', label: 'Atualização de proposta', sub: 'Quando o status de uma proposta mudar' },
        { key: 'contratacao', label: 'Contratação fechada', sub: 'Quando um deal for marcado como fechado' },
      ]
    },
    {
      titulo: 'Canais de Notificação',
      items: [
        { key: 'email', label: 'Notificações por e-mail', sub: 'Receber alertas no e-mail cadastrado' },
        { key: 'whatsapp', label: 'Notificações por WhatsApp', sub: 'Receber alertas no WhatsApp' },
        { key: 'relatorio', label: 'Relatório semanal', sub: 'Resumo de desempenho toda segunda-feira' },
        { key: 'sistema', label: 'Notificações do sistema', sub: 'Atualizações e manutenções programadas' },
      ]
    }
  ]

  return (
    <div>
      <SectionTitle title="Notificações" subtitle="Controle quais alertas você deseja receber" />
      {grupos.map(g => (
        <div key={g.titulo} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '4px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 0 4px' }}>{g.titulo}</div>
          {g.items.map(item => (
            <FieldRow key={item.key} label={item.label} sublabel={item.sub}>
              <Toggle checked={notifs[item.key]} onChange={() => toggle(item.key)} />
            </FieldRow>
          ))}
        </div>
      ))}
    </div>
  )
}

function SecaoEmpresa() {
  const [nome, setNome] = useState('Staffing Brasil')
  const [cnpj, setCnpj] = useState('00.000.000/0001-00')
  const [site, setSite] = useState('www.staffingbrasil.com.br')
  const [cidade, setCidade] = useState('São Paulo')
  const [estado, setEstado] = useState('SP')
  const [saved, setSaved] = useState(false)

  const salvar = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <SectionTitle title="Dados da Empresa" subtitle="Informações institucionais da Staffing Brasil" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <InputField label="Nome da empresa" value={nome} onChange={setNome} icon={Building2} />
        <InputField label="CNPJ" value={cnpj} onChange={setCnpj} />
        <InputField label="Site" value={site} onChange={setSite} icon={Globe} />
        <InputField label="E-mail comercial" value="comercial@staffingbrasil.com.br" onChange={() => {}} icon={Mail} />
        <InputField label="Cidade" value={cidade} onChange={setCidade} icon={MapPin} />
        <InputField label="Estado" value={estado} onChange={setEstado} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={salvar} className="btn-primary" style={{ fontSize: 13 }}>
          {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar</>}
        </button>
      </div>
    </div>
  )
}

function SecaoUsuarios({ user: currentUser }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState(null)
  const [salvando, setSalvando] = useState({})
  const [feedback, setFeedback] = useState({})

  const carregar = async () => {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, nome, email, role, created_at')
      .order('nome')
    if (error) setErro(error.message)
    else setUsuarios(data || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const trocarRole = async (userId, novoRole) => {
    setSalvando(s => ({ ...s, [userId]: true }))
    setFeedback(f => ({ ...f, [userId]: null }))
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: novoRole,
    })
    if (error) {
      setFeedback(f => ({ ...f, [userId]: 'erro' }))
      alert('Erro ao atualizar: ' + error.message)
    } else {
      setUsuarios(prev => prev.map(u => u.user_id === userId ? { ...u, role: novoRole } : u))
      setFeedback(f => ({ ...f, [userId]: 'ok' }))
      setTimeout(() => setFeedback(f => ({ ...f, [userId]: null })), 2000)
    }
    setSalvando(s => ({ ...s, [userId]: false }))
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <div>
      <SectionTitle title="Usuários" subtitle="Gerencie quem tem acesso ao CRM e seus níveis de permissão" />

      {/* Legenda de roles */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {ROLE_OPTIONS.map(r => {
          const colors = {
            admin:        { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)'    },
            comercial:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.2)'   },
            recrutamento: { color: '#a855f7', bg: 'rgba(168,85,247,0.08)',   border: 'rgba(168,85,247,0.2)'   },
          }
          const c = colors[r.value]
          return (
            <div key={r.value} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: c.color }}>{r.label}</span>
            </div>
          )
        })}
        <button onClick={carregar} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #27272a', color: '#52525b', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'inherit' }}>
          <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Atualizar
        </button>
      </div>

      {erro && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#dc2626' }}>{erro}</span>
        </div>
      )}

      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < 2 ? '1px solid #1c1c20' : 'none' }}>
              <div className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: 140, height: 13, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 200, height: 11, borderRadius: 4 }} />
              </div>
              <div className="skeleton" style={{ width: 120, height: 30, borderRadius: 7 }} />
            </div>
          ))
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#52525b', fontSize: 13 }}>
            Nenhum usuário encontrado. Execute o SQL de criação da tabela profiles.
          </div>
        ) : (
          usuarios.map((u, i) => {
            const isSelf    = u.user_id === currentUser?.id
            const roleColor = {
              admin:        '#ef4444',
              comercial:    '#3b82f6',
              recrutamento: '#a855f7',
            }[u.role] || '#71717a'

            return (
              <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < usuarios.length - 1 ? '1px solid #1c1c20' : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${roleColor}18`, border: `1px solid ${roleColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: roleColor }}>{avatarFromNome(u.nome)}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</span>
                    {isSelf && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, padding: '1px 6px', fontWeight: 600, flexShrink: 0 }}>você</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>

                {/* Role selector */}
                {isAdmin && !isSelf ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      value={u.role}
                      disabled={!!salvando[u.user_id]}
                      onChange={e => trocarRole(u.user_id, e.target.value)}
                      style={{ background: '#111113', border: `1px solid ${roleColor}44`, color: roleColor, padding: '6px 10px', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, opacity: salvando[u.user_id] ? 0.5 : 1 }}
                    >
                      {ROLE_OPTIONS.map(r => (
                        <option key={r.value} value={r.value} style={{ background: '#18181b', color: '#fafafa' }}>{r.label}</option>
                      ))}
                    </select>
                    {salvando[u.user_id] && <RefreshCw size={13} style={{ color: '#52525b', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                    {feedback[u.user_id] === 'ok' && <Check size={14} style={{ color: '#22c55e', flexShrink: 0 }} />}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, color: roleColor, background: `${roleColor}12`, border: `1px solid ${roleColor}30`, padding: '4px 10px', borderRadius: 7 }}>
                    {roleLabel(u.role)}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {!isAdmin && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Shield size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#71717a' }}>Somente administradores podem alterar roles de outros usuários.</span>
        </div>
      )}
    </div>
  )
}

function SecaoIntegracoes() {
  const [status, setStatus] = useState(
    Object.fromEntries(INTEGRACOES.map(i => [i.id, i.conectado]))
  )

  return (
    <div>
      <SectionTitle title="Integrações" subtitle="Conecte o CRM com outras ferramentas que você usa" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {INTEGRACOES.map(integ => (
          <div key={integ.id} style={{ background: '#18181b', border: `1px solid ${status[integ.id] ? 'rgba(34,197,94,0.15)' : '#27272a'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.2s' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${integ.color}22`, border: `1px solid ${integ.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plug size={18} style={{ color: integ.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>{integ.nome}</div>
              <div style={{ fontSize: 12, color: '#52525b' }}>{integ.desc}</div>
            </div>
            {status[integ.id] ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '3px 9px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Conectado</span>
                </div>
                <button onClick={() => setStatus(s => ({ ...s, [integ.id]: false }))}
                  className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}>Desconectar</button>
              </div>
            ) : (
              <button onClick={() => setStatus(s => ({ ...s, [integ.id]: true }))}
                className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>Conectar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SecaoAparencia() {
  const [idioma, setIdioma] = useState('pt-BR')
  const [fuso, setFuso] = useState('America/Sao_Paulo')
  const [density, setDensity] = useState('normal')

  return (
    <div>
      <SectionTitle title="Aparência" subtitle="Personalize a interface do CRM" />
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '4px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 0 4px' }}>Tema</div>
        <FieldRow label="Modo escuro" sublabel="Interface escura premium (ativo)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Ativo</span>
          </div>
        </FieldRow>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 0 4px' }}>Localização</div>
        <FieldRow label="Idioma">
          <select value={idioma} onChange={e => setIdioma(e.target.value)}
            style={{ background: '#111113', border: '1px solid #27272a', color: '#fafafa', padding: '6px 12px', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
            <option value="pt-BR" style={{ background: '#18181b' }}>Português (Brasil)</option>
            <option value="en" style={{ background: '#18181b' }}>English</option>
            <option value="es" style={{ background: '#18181b' }}>Español</option>
          </select>
        </FieldRow>
        <FieldRow label="Fuso horário">
          <select value={fuso} onChange={e => setFuso(e.target.value)}
            style={{ background: '#111113', border: '1px solid #27272a', color: '#fafafa', padding: '6px 12px', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}>
            <option value="America/Sao_Paulo" style={{ background: '#18181b' }}>Brasília (UTC-3)</option>
            <option value="America/Manaus" style={{ background: '#18181b' }}>Manaus (UTC-4)</option>
            <option value="America/Fortaleza" style={{ background: '#18181b' }}>Fortaleza (UTC-3)</option>
          </select>
        </FieldRow>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: 0.5, padding: '14px 0 4px' }}>Layout</div>
        <FieldRow label="Densidade da interface">
          <div style={{ display: 'flex', gap: 6 }}>
            {['compacto', 'normal', 'espaçado'].map(d => (
              <button key={d} onClick={() => setDensity(d)}
                style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${density === d ? 'rgba(239,68,68,0.3)' : '#27272a'}`, background: density === d ? 'rgba(239,68,68,0.08)' : 'transparent', color: density === d ? '#ef4444' : '#71717a', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                {d}
              </button>
            ))}
          </div>
        </FieldRow>
      </div>
    </div>
  )
}

function SecaoPrivacidade() {
  const [notifs, setNotifs] = useState({ analytics: true, logs: true, export: false })
  const toggle = k => setNotifs(n => ({ ...n, [k]: !n[k] }))

  return (
    <div>
      <SectionTitle title="Privacidade & LGPD" subtitle="Controle como seus dados são utilizados" />
      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
        <Shield size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>Conformidade com a LGPD</div>
          <div style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>Este sistema está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Seus dados são tratados com segurança e transparência.</div>
        </div>
      </div>
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '4px 20px', marginBottom: 16 }}>
        <FieldRow label="Análise de uso" sublabel="Permitir coleta de dados de navegação para melhorias">
          <Toggle checked={notifs.analytics} onChange={() => toggle('analytics')} />
        </FieldRow>
        <FieldRow label="Logs de auditoria" sublabel="Manter registro de todas as ações realizadas no sistema">
          <Toggle checked={notifs.logs} onChange={() => toggle('logs')} />
        </FieldRow>
        <FieldRow label="Exportação de dados" sublabel="Permitir exportar dados pessoais em formato CSV">
          <Toggle checked={notifs.export} onChange={() => toggle('export')} />
        </FieldRow>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-secondary" style={{ fontSize: 13 }}>Solicitar meus dados</button>
        <button style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '10px 20px', borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
          <Trash2 size={13} /> Excluir minha conta
        </button>
      </div>
    </div>
  )
}

const SECOES = {
  perfil: SecaoPerfil,
  seguranca: SecaoSeguranca,
  notificacoes: SecaoNotificacoes,
  empresa: SecaoEmpresa,
  usuarios: SecaoUsuarios,
  integrações: SecaoIntegracoes,
  aparencia: SecaoAparencia,
  privacidade: SecaoPrivacidade,
}

export default function Configuracoes() {
  const [ativa, setAtiva] = useState('perfil')
  const { user } = useAuth()
  const SecaoAtiva = SECOES[ativa]

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Menu lateral */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 12, overflow: 'hidden' }}>
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon
            const isActive = ativa === item.id
            return (
              <button key={item.id} onClick={() => setAtiva(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', background: isActive ? 'rgba(239,68,68,0.06)' : 'transparent',
                  borderLeft: isActive ? '2px solid #ef4444' : '2px solid transparent',
                  borderRight: 'none', borderTop: 'none', borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid #1c1c20' : 'none',
                  cursor: 'pointer', color: isActive ? '#fafafa' : '#71717a', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#a1a1aa' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717a' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon size={14} style={{ color: isActive ? '#ef4444' : 'currentColor' }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={12} style={{ color: '#ef4444' }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo */}
      <motion.div key={ativa}
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
        style={{ flex: 1, minWidth: 0 }}>
        <SecaoAtiva user={user} />
      </motion.div>
    </div>
  )
}
