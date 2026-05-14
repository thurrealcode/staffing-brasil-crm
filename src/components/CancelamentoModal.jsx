import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function CancelamentoModal({ titulo, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('')

  const inputStyle = {
    width: '100%', background: '#ffffff', border: '1px solid #d1d5db',
    color: '#0f172a', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    resize: 'vertical', lineHeight: 1.5,
  }
  const labelStyle = {
    fontSize: 11, color: '#64748b', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 5, display: 'block',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Motivo do Cancelamento</h2>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{titulo}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginTop: 2 }}><X size={17} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Por que está cancelando? *</label>
            <textarea
              autoFocus
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Cliente reagendou, lead perdeu interesse, conflito de agenda..."
              rows={4}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e4e4e7', color: '#475569', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Voltar
            </button>
            <button
              onClick={() => motivo.trim() && onConfirm(motivo.trim())}
              disabled={!motivo.trim()}
              style={{ flex: 1, background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: motivo.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600, opacity: motivo.trim() ? 1 : 0.5 }}>
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
