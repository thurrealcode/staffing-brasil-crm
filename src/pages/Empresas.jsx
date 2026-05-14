import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Building2, MapPin, Users, Briefcase, TrendingUp,
  Mail, Phone, X, ChevronRight, Edit2, Trash2, Loader2, AlertCircle, RefreshCw
} from 'lucide-react'
import { fetchEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '../lib/empresasService'
import CancelamentoModal from '../components/CancelamentoModal'
import { registrarCancelamento } from '../lib/cancelamentosService'

// ── Configuração de status ────────────────────────────────────
const STATUS_CONFIG = {
  'Cliente Ativo':   { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
  'Em Negociação':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  'Proposta Enviada':{ color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  'Inativo':         { color: '#6b7280', bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.2)' },
}

const ALL_STATUSES  = Object.keys(STATUS_CONFIG)
const SEGMENTOS     = [
  'Contabilidade', 'Escritório Contábil', 'Advocacia', 'Tecnologia',
  'Logística', 'Indústria', 'Comércio', 'Varejo', 'Saúde',
  'Construção Civil', 'Financeiro', 'Recursos Humanos',
  'Terceirização', 'Consultoria', 'Agência', 'E-commerce',
]
const ESTADOS_BR    = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const EMPTY_EMPRESA = {
  nome: '', cnpj: '', segmento: 'Tecnologia', cidade: '', estado: 'SP',
  status: 'Em Negociação', contatoNome: '', contatoEmail: '',
  contatoTelefone: '', contatoWhatsapp: '', vagasAbertas: 0,
  totalContratacoes: 0, observacoes: '',
}

// ── Helpers visuais ───────────────────────────────────────────
function ResponsavelChip({ nome }) {
  if (!nome) return null
  const initials = nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={nome}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{initials}</span>
      </div>
      <span style={{ fontSize: 11, color: '#94a3b8' }}>{nome.split(' ')[0]}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG['Inativo']
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 4 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#dc2626', flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} /> Tentar novamente
        </button>
      )}
    </motion.div>
  )
}

// ── Modal de visualização (detalhes) ─────────────────────────
function EmpresaViewModal({ empresa, onClose, onEdit }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, background: '#f1f5f9', border: '1px solid #e4e4e7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} style={{ color: '#64748b' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{empresa.nome}</h2>
              <StatusBadge status={empresa.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onEdit}
              style={{ width: 32, height: 32, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#9ca3af' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e4e4e7' }}>
              <Edit2 size={13} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Vagas Abertas',      value: empresa.vagasAbertas,      color: '#ef4444', icon: Briefcase },
              { label: 'Total Contratações', value: empresa.totalContratacoes, color: '#22c55e', icon: Users },
              { label: 'Atualizado em',      value: empresa.updatedAt ? new Date(empresa.updatedAt).toLocaleDateString('pt-BR') : '—', color: '#3b82f6', icon: TrendingUp },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={12} style={{ color }} />
                  <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Dados cadastrais */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'CNPJ',       value: empresa.cnpj    || '—' },
              { label: 'Segmento',   value: empresa.segmento || '—' },
              { label: 'Localização',value: [empresa.cidade, empresa.estado].filter(Boolean).join(', ') || '—' },
              { label: 'Cadastrado', value: empresa.createdAt ? new Date(empresa.createdAt).toLocaleDateString('pt-BR') : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Contato principal */}
          <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Contato Principal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{empresa.contatoNome || '—'}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {empresa.contatoEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: 12, color: '#475569' }}>{empresa.contatoEmail}</span>
                  </div>
                )}
                {empresa.contatoTelefone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={12} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: 12, color: '#475569' }}>{empresa.contatoTelefone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          {empresa.observacoes && (
            <div style={{ background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Observações</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{empresa.observacoes}</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Modal de criação / edição ─────────────────────────────────
function EmpresaFormModal({ empresa, saving, onClose, onSave }) {
  const [form, setForm] = useState(empresa ? {
    nome:              empresa.nome              ?? '',
    cnpj:              empresa.cnpj              ?? '',
    segmento:          empresa.segmento          ?? 'Tecnologia',
    cidade:            empresa.cidade            ?? '',
    estado:            empresa.estado            ?? 'SP',
    status:            empresa.status            ?? 'Em Negociação',
    contatoNome:       empresa.contatoNome       ?? '',
    contatoEmail:      empresa.contatoEmail      ?? '',
    contatoTelefone:   empresa.contatoTelefone   ?? '',
    contatoWhatsapp:   empresa.contatoWhatsapp   ?? '',
    vagasAbertas:      empresa.vagasAbertas      ?? 0,
    totalContratacoes: empresa.totalContratacoes ?? 0,
    observacoes:       empresa.observacoes       ?? '',
  } : EMPTY_EMPRESA)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const inputStyle = { width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 13px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }

  const LabeledInput = ({ label, field, placeholder, type = 'text', span = 1 }) => (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'auto' }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {empresa?.id ? 'Editar Empresa' : 'Nova Empresa'}
          </h2>
          <button onClick={onClose} disabled={saving} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Dados da empresa */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Dados da Empresa</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <LabeledInput label="Nome da empresa *" field="nome" placeholder="Ex: TechCorp Brasil" span={2} />
              <LabeledInput label="CNPJ" field="cnpj" placeholder="00.000.000/0001-00" />
              <div>
                <label style={labelStyle}>Segmento</label>
                <select value={form.segmento} onChange={e => set('segmento', e.target.value)} style={inputStyle}>
                  {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <LabeledInput label="Cidade" field="cidade" placeholder="São Paulo" />
              <div>
                <label style={labelStyle}>Estado</label>
                <select value={form.estado} onChange={e => set('estado', e.target.value)} style={inputStyle}>
                  {ESTADOS_BR.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_STATUSES.map(s => {
                const c = STATUS_CONFIG[s]
                return (
                  <button key={s} onClick={() => set('status', s)}
                    style={{ ...(form.status === s ? { background: c.bg, border: `1px solid ${c.border}`, color: c.color } : { background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#64748b' }), padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contato */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Contato Principal</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <LabeledInput label="Nome" field="contatoNome" placeholder="Nome do contato" span={2} />
              <LabeledInput label="Email" field="contatoEmail" placeholder="email@empresa.com" type="email" />
              <LabeledInput label="Telefone" field="contatoTelefone" placeholder="(11) 3456-7890" />
              <LabeledInput label="WhatsApp" field="contatoWhatsapp" placeholder="(11) 99999-9999" span={2} />
            </div>
          </div>

          {/* Métricas */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Métricas</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Vagas Abertas</label>
                <input type="number" min={0} value={form.vagasAbertas} onChange={e => set('vagasAbertas', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Total Contratações</label>
                <input type="number" min={0} value={form.totalContratacoes} onChange={e => set('totalContratacoes', e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Notas sobre a empresa..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} disabled={saving} className="btn-secondary" style={{ fontSize: 13 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.nome.trim()} className="btn-primary" style={{ fontSize: 13 }}>
            {saving
              ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
              : (empresa?.id ? 'Salvar alterações' : 'Adicionar Empresa')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Empresas() {
  const [empresas, setEmpresas]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [viewModal, setViewModal]   = useState(null)
  const [formModal, setFormModal]   = useState(null)
  const [cancelModalData, setCancelModalData] = useState(null)

  const loadEmpresas = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchEmpresas()
      setEmpresas(data)
    } catch (e) {
      setError(e.message || 'Erro ao carregar empresas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEmpresas() }, [loadEmpresas])

  const handleSave = async (form) => {
    if (!form.nome?.trim()) return
    setSaving(true)
    setError('')
    try {
      if (form.id) {
        const updated = await updateEmpresa(form.id, form)
        setEmpresas(es => es.map(e => e.id === form.id ? updated : e))
        setViewModal(updated)
      } else {
        const created = await createEmpresa(form)
        setEmpresas(es => [created, ...es])
      }
      setFormModal(null)
    } catch (e) {
      setError(e.message || 'Erro ao salvar empresa.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (empresa) => {
    setCancelModalData({
      titulo: `Empresa: ${empresa.nome}`,
      onConfirm: async (motivo) => {
        setCancelModalData(null)
        setDeletingId(empresa.id)
        setError('')
        try {
          await registrarCancelamento({ titulo: `Empresa: ${empresa.nome}`, tipo: 'empresa', motivo })
          await deleteEmpresa(empresa.id)
          setEmpresas(es => es.filter(e => e.id !== empresa.id))
          if (viewModal?.id === empresa.id) setViewModal(null)
        } catch (err) {
          setError(err.message || 'Erro ao excluir empresa.')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const filtered = empresas
    .filter(e => filterStatus === 'Todos' || e.status === filterStatus)
    .filter(e => !search || [e.nome, e.segmento, e.cidade, e.contatoNome].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Empresas</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : `${filtered.length} de ${empresas.length} empresas`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setFormModal({})}>
          <Plus size={15} /> Nova Empresa
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && <ErrorBanner message={error} onRetry={!saving && !deletingId ? loadEmpresas : undefined} />}
      </AnimatePresence>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input placeholder="Buscar empresa, segmento, cidade..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#ffffff', border: '1px solid #e4e4e7', color: '#0f172a', padding: '8px 12px 8px 34px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#374151', padding: '8px 14px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
          <option>Todos</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={loadEmpresas} disabled={loading} title="Atualizar"
          style={{ width: 34, height: 34, background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#9ca3af' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e4e4e7' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Grid de cards */}
      {loading ? <LoadingSkeleton /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            <AnimatePresence>
              {filtered.map((empresa, i) => {
                const isDeleting = deletingId === empresa.id
                return (
                  <motion.div key={empresa.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.05 }}
                    onClick={() => !isDeleting && setViewModal(empresa)}
                    style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '20px 22px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    whileHover={{ y: -2, borderColor: '#cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, background: '#f1f5f9', border: '1px solid #e4e4e7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={18} style={{ color: '#64748b' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.nome}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{empresa.segmento || '—'}</div>
                        </div>
                      </div>
                      <StatusBadge status={empresa.status} />
                    </div>

                    {/* Card info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {empresa.cidade && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#64748b' }}>{[empresa.cidade, empresa.estado].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {empresa.contatoNome && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.contatoNome}</span>
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{empresa.vagasAbertas}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Vagas</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{empresa.totalContratacoes}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Contratações</div>
                        </div>
                        <ResponsavelChip nome={empresa.responsavelNome} />
                      </div>

                      {/* Ações */}
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => { e.stopPropagation(); setViewModal(null); setFormModal(empresa) }}
                          disabled={isDeleting}
                          style={{ width: 28, height: 28, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#9ca3af' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e4e4e7' }}>
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(empresa) }}
                          disabled={isDeleting}
                          style={{ width: 28, height: 28, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e4e4e7' }}>
                          {isDeleting ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={11} />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Estado vazio */}
          {filtered.length === 0 && (
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 52, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: '#f1f5f9', border: '1px solid #e4e4e7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Building2 size={20} style={{ color: '#9ca3af' }} />
              </div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>
                {empresas.length === 0 ? 'Nenhuma empresa cadastrada ainda.' : 'Nenhuma empresa encontrada para esses filtros.'}
              </div>
              {empresas.length === 0 && (
                <button className="btn-primary" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setFormModal({})}>
                  <Plus size={14} /> Adicionar primeira empresa
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <AnimatePresence>
        {viewModal && (
          <EmpresaViewModal
            empresa={viewModal}
            onClose={() => setViewModal(null)}
            onEdit={() => { setFormModal(viewModal); setViewModal(null) }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {formModal !== null && (
          <EmpresaFormModal
            empresa={formModal?.id ? formModal : null}
            saving={saving}
            onClose={() => !saving && setFormModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelModalData && (
          <CancelamentoModal
            titulo={cancelModalData.titulo}
            onConfirm={cancelModalData.onConfirm}
            onClose={() => setCancelModalData(null)}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
