import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, X, ChevronUp, ChevronDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { fetchLeads, createLead, updateLead, deleteLead } from '../lib/leadsService'
import CancelamentoModal from '../components/CancelamentoModal'
import { registrarCancelamento } from '../lib/cancelamentosService'

// ── Configurações de status ───────────────────────────────────
const STATUS_CONFIG = {
  'Novo Lead':     { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'  },
  'Contato Feito': { color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)'  },
  'Interessado':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'  },
  'Reunião':       { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  'Proposta':      { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)'  },
  'Fechado':       { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)'   },
  'Perdido':       { color: '#6b7280', bg: 'rgba(107,114,128,0.08)',border: 'rgba(107,114,128,0.2)' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG)

const SEGMENTOS = [
  'Todos',
  'Contabilidade', 'Escritório Contábil', 'Advocacia', 'Tecnologia',
  'Logística', 'Indústria', 'Comércio', 'Varejo', 'Saúde',
  'Construção Civil', 'Financeiro', 'Recursos Humanos',
  'Terceirização', 'Consultoria', 'Agência', 'E-commerce',
]

const EMPTY_LEAD = { empresa: '', contato: '', whatsapp: '', email: '', cidade: '', segmento: 'Tecnologia', status: 'Novo Lead', ultimoContato: '', observacoes: '', tags: [] }

// ── Componentes auxiliares ────────────────────────────────────
function ResponsavelChip({ nome }) {
  if (!nome) return null
  const initials = nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={nome}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444', lineHeight: 1 }}>{initials}</span>
      </div>
      <span style={{ fontSize: 11, color: '#64748b' }}>{nome.split(' ')[0]}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG['Novo Lead']
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ padding: '16px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[200, 140, 100, 90, 80].map((w, j) => (
            <div key={j} className="skeleton" style={{ height: 14, width: w, borderRadius: 4 }} />
          ))}
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

// ── Modal de criação / edição ─────────────────────────────────
function Modal({ lead, saving, onClose, onSave }) {
  const [form, setForm] = useState(lead || EMPTY_LEAD)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
      >
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{lead?.id ? 'Editar Lead' : 'Novo Lead'}</h2>
          <button onClick={onClose} disabled={saving} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Empresa', key: 'empresa', placeholder: 'Nome da empresa' },
              { label: 'Contato', key: 'contato', placeholder: 'Nome do contato' },
              { label: 'WhatsApp', key: 'whatsapp', placeholder: '(11) 99999-9999' },
              { label: 'Email', key: 'email', placeholder: 'email@empresa.com' },
              { label: 'Cidade', key: 'cidade', placeholder: 'São Paulo' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  className="input-premium" style={{ fontSize: 13 }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Segmento</label>
              <select value={form.segmento} onChange={e => set('segmento', e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 13px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                {SEGMENTOS.slice(1).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_STATUSES.map(s => (
                <button key={s} onClick={() => set('status', s)}
                  style={{ ...(form.status === s ? { background: STATUS_CONFIG[s].bg, border: `1px solid ${STATUS_CONFIG[s].border}`, color: STATUS_CONFIG[s].color } : { background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#64748b' }), padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Último Contato</label>
            <input type="date" value={form.ultimoContato || ''} onChange={e => set('ultimoContato', e.target.value)}
              style={{ background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 13px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Observações</label>
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Notas sobre o lead..." rows={3}
              style={{ width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 13px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} disabled={saving} className="btn-secondary" style={{ fontSize: 13 }}>Cancelar</button>
          <button onClick={() => onSave(form)} disabled={saving} className="btn-primary" style={{ fontSize: 13 }}>
            {saving ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</> : (lead?.id ? 'Salvar alterações' : 'Adicionar Lead')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function Leads() {
  const [leads, setLeads]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterSeg, setFilterSeg] = useState('Todos')
  const [modal, setModal]         = useState(null)
  const [sort, setSort]           = useState({ key: 'empresa', dir: 1 })
  const [cancelModalData, setCancelModalData] = useState(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchLeads()
      setLeads(data)
    } catch (e) {
      setError(e.message || 'Erro ao carregar leads.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const handleSave = async (form) => {
    if (form.id && form.status === 'Perdido') {
      const current = leads.find(l => l.id === form.id)
      if (current?.status !== 'Perdido') {
        setCancelModalData({
          titulo: `Lead: ${form.empresa}`,
          onConfirm: async (motivo) => {
            await registrarCancelamento({ titulo: `Lead: ${form.empresa}`, tipo: 'lead', motivo })
            setCancelModalData(null)
            await doSave(form)
          },
        })
        return
      }
    }
    await doSave(form)
  }

  const doSave = async (form) => {
    setSaving(true)
    setError('')
    try {
      if (form.id) {
        const updated = await updateLead(form.id, form)
        setLeads(ls => ls.map(l => l.id === form.id ? updated : l))
      } else {
        const created = await createLead(form)
        setLeads(ls => [created, ...ls])
      }
      setModal(null)
    } catch (e) {
      setError(e.message || 'Erro ao salvar lead.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (lead) => {
    setCancelModalData({
      titulo: `Lead: ${lead.empresa}`,
      onConfirm: async (motivo) => {
        setCancelModalData(null)
        setDeletingId(lead.id)
        setError('')
        try {
          await registrarCancelamento({ titulo: `Lead: ${lead.empresa}`, tipo: 'lead', motivo })
          await deleteLead(lead.id)
          setLeads(ls => ls.filter(l => l.id !== lead.id))
        } catch (e) {
          setError(e.message || 'Erro ao excluir lead.')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  const filtered = leads
    .filter(l => filterStatus === 'Todos' || l.status === filterStatus)
    .filter(l => filterSeg === 'Todos' || l.segmento === filterSeg)
    .filter(l => !search || [l.empresa, l.contato, l.email, l.cidade].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => (a[sort.key] || '').localeCompare(b[sort.key] || '') * sort.dir)

  const handleSort = (key) => setSort(s => ({ key, dir: s.key === key ? -s.dir : 1 }))
  const SortIcon = ({ k }) => sort.key === k ? (sort.dir === 1 ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null

  const COLS = [
    { key: 'empresa',           label: 'Empresa' },
    { key: 'contato',           label: 'Contato' },
    { key: 'cidade',            label: 'Cidade' },
    { key: 'segmento',          label: 'Segmento' },
    { key: 'status',            label: 'Status' },
    { key: 'ultimoContato',     label: 'Último Contato' },
    { key: 'responsavelNome',   label: 'Responsável' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Leads</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : `${filtered.length} de ${leads.length} leads`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={15} /> Novo Lead
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && <ErrorBanner message={error} onRetry={!saving && !deletingId ? loadLeads : undefined} />}
      </AnimatePresence>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input placeholder="Buscar empresa, contato, cidade..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: '#ffffff', border: '1px solid #e4e4e7', color: '#0f172a', padding: '8px 12px 8px 34px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#374151', padding: '8px 14px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
          <option>Todos</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSeg} onChange={e => setFilterSeg(e.target.value)}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#374151', padding: '8px 14px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
          {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={loadLeads} disabled={loading}
          style={{ width: 34, height: 34, background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.15s' }}
          title="Atualizar"
          onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#9ca3af' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e4e4e7' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Table */}
      {loading ? <LoadingSkeleton /> : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8f9fa' }}>
                  {COLS.map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)}
                      style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: sort.key === col.key ? '#374151' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', transition: 'color 0.15s' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {col.label} <SortIcon k={col.key} />
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((lead, i) => {
                    const isDeleting = deletingId === lead.id
                    return (
                      <motion.tr key={lead.id}
                        initial={{ opacity: 0 }} animate={{ opacity: isDeleting ? 0.4 : 1 }} exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: i * 0.02 }}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.background = '#fafafa' }}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{lead.empresa}</div>
                          {lead.tags?.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {lead.tags.map(t => (
                                <span key={t} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500 }}>{t}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 13, color: '#374151' }}>{lead.contato}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{lead.whatsapp}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>{lead.cidade}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: '#f1f5f9', border: '1px solid #e4e4e7', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{lead.segmento}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}><StatusBadge status={lead.status} /></td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8' }}>
                          {lead.ultimoContato ? new Date(lead.ultimoContato + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <ResponsavelChip nome={lead.responsavelNome} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal(lead)} disabled={isDeleting}
                              style={{ width: 30, height: 30, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.color = '#0f172a' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#64748b' }}>
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => handleDelete(lead)} disabled={isDeleting}
                              style={{ width: 30, height: 30, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.color = '#64748b' }}>
                              {isDeleting ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div style={{ padding: 52, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, background: '#f1f5f9', border: '1px solid #e4e4e7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Search size={20} style={{ color: '#9ca3af' }} />
                </div>
                <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>
                  {leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead encontrado para esses filtros.'}
                </div>
                {leads.length === 0 && (
                  <button className="btn-primary" style={{ marginTop: 12, fontSize: 13 }} onClick={() => setModal({})}>
                    <Plus size={14} /> Adicionar primeiro lead
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal !== null && (
          <Modal
            lead={modal?.id ? modal : null}
            saving={saving}
            onClose={() => !saving && setModal(null)}
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
