import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Building2, User, MapPin, X, RefreshCw, AlertCircle, Pencil, Trash2, Video } from 'lucide-react'
import { fetchAgenda, createEvento, updateEvento, deleteEvento } from '../lib/agendaService'

const TIPO_CONFIG = {
  'Reunião':    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)' },
  'Entrevista': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  'Follow-up':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
}

const STATUS_OPTS = ['Agendado', 'Confirmado', 'Realizado', 'Cancelado']
const TIPOS       = Object.keys(TIPO_CONFIG)
const DAYS        = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS      = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Utilitários ───────────────────────────────────────────────

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
      <span style={{ color: '#dc2626', fontSize: 13, flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

// ── Modal de formulário ───────────────────────────────────────

const EMPTY_FORM = { titulo: '', tipo: 'Reunião', data: todayStr(), horario: '', empresa: '', contato: '', local: '', status: 'Agendado', observacoes: '' }

function EventoFormModal({ initial, defaultDate, onClose, onSave, saving }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(
    initial
      ? { titulo: initial.titulo, tipo: initial.tipo, data: initial.data, horario: initial.horario, empresa: initial.empresa, contato: initial.contato, local: initial.local, status: initial.status, observacoes: initial.observacoes }
      : { ...EMPTY_FORM, data: defaultDate || todayStr() }
  )

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.data) return
    onSave(form)
  }

  const inputStyle = { width: '100%', background: '#ffffff', border: '1px solid #d1d5db', color: '#0f172a', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{isEdit ? 'Editar Evento' : 'Novo Evento'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título *</label>
              <input required value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Reunião TechCorp Brasil" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={inputStyle}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Data *</label>
              <input required type="date" value={form.data} onChange={e => set('data', e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Horário</label>
              <input type="time" value={form.horario} onChange={e => set('horario', e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Empresa</label>
              <input value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Contato</label>
              <input value={form.contato} onChange={e => set('contato', e.target.value)} placeholder="Nome do contato" style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Local</label>
              <input value={form.local} onChange={e => set('local', e.target.value)} placeholder="Ex: Google Meet, Presencial - SP" style={inputStyle} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Detalhes adicionais do evento..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
              {saving ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Salvando...</> : (isEdit ? 'Salvar Alterações' : 'Adicionar Evento')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

export default function Agenda() {
  const today = todayStr()
  const nowDate = new Date()

  const [eventos,      setEventos]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [current,      setCurrent]      = useState({ year: nowDate.getFullYear(), month: nowDate.getMonth() })
  const [selectedDate, setSelectedDate] = useState(today)
  const [formOpen,     setFormOpen]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)

  const loadAgenda = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEventos(await fetchAgenda())
    } catch (err) {
      setError(err.message || 'Erro ao carregar agenda')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAgenda() }, [loadAgenda])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await updateEvento(editTarget.id, data)
        setEventos(prev => prev.map(e => e.id === updated.id ? updated : e).sort(sortFn))
      } else {
        const created = await createEvento(data)
        setEventos(prev => [...prev, created].sort(sortFn))
        setSelectedDate(created.data)
      }
      setFormOpen(false)
      setEditTarget(null)
    } catch (err) {
      alert(err.message || 'Erro ao salvar evento')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este evento?')) return
    setDeletingId(id)
    try {
      await deleteEvento(id)
      setEventos(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      alert(err.message || 'Erro ao excluir evento')
    } finally {
      setDeletingId(null)
    }
  }

  const openEdit = (evento) => {
    setEditTarget(evento)
    setFormOpen(true)
  }

  const openNew = (date) => {
    setEditTarget(null)
    setFormOpen(true)
    if (date) setSelectedDate(date)
  }

  // Calendar helpers
  const firstDay    = new Date(current.year, current.month, 1).getDay()
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()
  const prevMonth   = () => setCurrent(c => c.month === 0  ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
  const nextMonth   = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0  } : { ...c, month: c.month + 1 })

  const allDates      = new Set(eventos.map(e => e.data))
  const selectedEvts  = eventos.filter(e => e.data === selectedDate)
  const upcomingEvts  = eventos.filter(e => e.data >= today).slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Agenda</h2>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {loading ? 'Carregando...' : `${eventos.length} evento${eventos.length !== 1 ? 's' : ''} cadastrado${eventos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAgenda} title="Atualizar"
            style={{ background: '#ffffff', border: '1px solid #e4e4e7', color: '#64748b', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="btn-primary" onClick={() => openNew(selectedDate)}>
            <Plus size={15} /> Novo Evento
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadAgenda} />}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        {/* ── Calendário ── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          {/* Nav mês */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ width: 28, height: 28, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{MONTHS[current.month]} {current.year}</span>
            <button onClick={nextMonth} style={{ width: 28, height: 28, background: '#f8f9fa', border: '1px solid #e4e4e7', borderRadius: 6, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Nomes dos dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Dias do mês */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day     = i + 1
              const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday    = dateStr === today
              const isSelected = dateStr === selectedDate
              const hasEvents  = allDates.has(dateStr)
              return (
                <div key={day} onClick={() => setSelectedDate(dateStr)}
                  style={{
                    aspectRatio: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, cursor: 'pointer', position: 'relative',
                    background: isSelected ? '#ef4444' : isToday ? 'rgba(239,68,68,0.1)' : 'transparent',
                    border: isToday && !isSelected ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8f9fa' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(239,68,68,0.08)' : 'transparent' }}
                >
                  <span style={{ fontSize: 12, fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? 'white' : isToday ? '#ef4444' : '#475569' }}>
                    {day}
                  </span>
                  {hasEvents && !isSelected && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', marginTop: 2 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Próximos eventos */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Próximos Eventos</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: '80%', height: 11, borderRadius: 3, marginBottom: 4 }} />
                      <div className="skeleton" style={{ width: '55%', height: 10, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvts.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Nenhum evento próximo</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvts.map(e => {
                  const cfg = TIPO_CONFIG[e.tipo] || TIPO_CONFIG['Reunião']
                  return (
                    <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => { setSelectedDate(e.data); setCurrent({ year: parseInt(e.data.slice(0,4)), month: parseInt(e.data.slice(5,7)) - 1 }) }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titulo}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')}{e.horario ? ` · ${e.horario}` : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Eventos da data selecionada ── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {selectedDate
              ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
              : 'Selecione uma data'}
          </div>

          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderLeft: '3px solid #e4e4e7', borderRadius: 12, padding: '20px 22px' }}>
                <div className="skeleton" style={{ width: '60%', height: 15, borderRadius: 4, marginBottom: 10 }} />
                <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 6, marginBottom: 14 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[...Array(3)].map((_, j) => <div key={j} className="skeleton" style={{ height: 12, borderRadius: 3 }} />)}
                </div>
              </div>
            ))
          ) : selectedEvts.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <Calendar size={32} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Nenhum evento nesta data</p>
              <button className="btn-primary" style={{ marginTop: 12, fontSize: 12, padding: '8px 16px' }}
                onClick={() => openNew(selectedDate)}>
                <Plus size={13} /> Adicionar evento
              </button>
            </div>
          ) : (
            selectedEvts.map((event, i) => {
              const cfg       = TIPO_CONFIG[event.tipo] || TIPO_CONFIG['Reunião']
              const isDeleting = deletingId === event.id
              return (
                <motion.div key={event.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 12, padding: '20px 22px', borderLeft: `3px solid ${cfg.color}`, opacity: isDeleting ? 0.5 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{event.titulo}</div>
                      <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{event.tipo}</span>
                      {event.status && event.status !== 'Agendado' && (
                        <span style={{ marginLeft: 6, background: '#f1f5f9', border: '1px solid #e4e4e7', color: '#64748b', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{event.status}</span>
                      )}
                    </div>
                    {event.horario && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <Clock size={12} style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{event.horario}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { icon: Building2, label: event.empresa },
                      { icon: User,      label: event.contato },
                      { icon: MapPin,    label: event.local },
                    ].map(({ icon: Icon, label }) => label ? (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon size={12} style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                      </div>
                    ) : null)}
                  </div>

                  {event.observacoes && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                      {event.observacoes}
                    </div>
                  )}

                  {event.meetLink && (
                    <div style={{ marginTop: 14 }}>
                      <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'linear-gradient(135deg,#1a73e8,#1558c0)', border: 'none', color: '#fff', padding: '9px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box' }}>
                        <Video size={13} /> Entrar no Google Meet
                      </a>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => openEdit(event)}
                      style={{ flex: 1, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Pencil size={12} /> Editar
                    </button>
                    <button onClick={() => handleDelete(event.id)} disabled={isDeleting}
                      style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#64748b', padding: '8px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: isDeleting ? 0.5 : 1 }}>
                      {isDeleting
                        ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Excluindo...</>
                        : <><Trash2 size={12} /> Excluir</>}
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {formOpen && (
          <EventoFormModal
            key="form"
            initial={editTarget}
            defaultDate={selectedDate}
            onClose={() => { setFormOpen(false); setEditTarget(null) }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// sort helper used after mutations
function sortFn(a, b) {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1
  return a.horario < b.horario ? -1 : 1
}
