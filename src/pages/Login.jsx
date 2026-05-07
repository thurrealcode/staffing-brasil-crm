import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, User, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// 'login' | 'register' | 'reset' | 'confirmed'
const MODES = { LOGIN: 'login', REGISTER: 'register', RESET: 'reset', CONFIRMED: 'confirmed' }

export default function Login() {
  const [mode, setMode] = useState(MODES.LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const { login, register, resetPassword, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const clearMessages = () => { setError(''); setInfo('') }

  const switchMode = (next) => {
    clearMessages()
    setMode(next)
  }

  // ---- Login ----
  const handleLogin = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---- Cadastro ----
  const handleRegister = async (e) => {
    e.preventDefault()
    clearMessages()
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return }
    setLoading(true)
    try {
      const result = await register(email, password, name)
      if (result.needsConfirmation) {
        setMode(MODES.CONFIRMED)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---- Recuperação de senha ----
  const handleReset = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      await resetPassword(email)
      setInfo('Email enviado! Verifique sua caixa de entrada e siga o link para redefinir a senha.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---- Reenviar confirmação ----
  const handleResend = async () => {
    clearMessages()
    setLoading(true)
    try {
      await resendConfirmation(email)
      setInfo('Email de confirmação reenviado!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#18181b', border: '1px solid #27272a',
    color: '#fafafa', padding: '10px 14px', borderRadius: 8,
    fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const inputWithIconStyle = { ...inputStyle, paddingLeft: 36 }

  const Field = ({ icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, rightSlot }) => (
    <div style={{ position: 'relative' }}>
      <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        autoComplete={autoComplete} required
        style={{ ...inputWithIconStyle, paddingRight: rightSlot ? 40 : 14 }}
        onFocus={e => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)' }}
        onBlur={e => { e.target.style.borderColor = '#27272a'; e.target.style.boxShadow = 'none' }}
      />
      {rightSlot}
    </div>
  )

  const PasswordToggle = (
    <button type="button" onClick={() => setShowPass(v => !v)}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 0 }}>
      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )

  const SubmitButton = ({ label, loadingLabel }) => (
    <motion.button type="submit" disabled={loading}
      whileHover={!loading ? { scale: 1.01, y: -1 } : {}}
      whileTap={!loading ? { scale: 0.99 } : {}}
      style={{
        background: loading ? '#7f1d1d' : '#ef4444',
        color: 'white', border: 'none', padding: '12px 20px',
        borderRadius: 8, fontSize: 14, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'inherit', width: '100%', marginTop: 4,
        boxShadow: loading ? 'none' : '0 0 24px rgba(239,68,68,0.22)',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}>
      {loading
        ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />{loadingLabel}</>
        : <>{label}<ArrowRight size={16} /></>}
    </motion.button>
  )

  const MessageBox = ({ text, isError }) => text ? (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
        borderRadius: 8, padding: '10px 14px', fontSize: 12,
        color: isError ? '#fca5a5' : '#86efac', lineHeight: 1.5,
      }}>
      {text}
    </motion.div>
  ) : null

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.06), transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08), transparent)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, padding: '0 24px', position: 'relative', zIndex: 10 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 4 }}
          >
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(239,68,68,0.35)' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>SB</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', letterSpacing: -0.5 }}>Staffing Brasil</div>
              <div style={{ fontSize: 12, color: '#52525b', fontWeight: 400 }}>CRM Enterprise</div>
            </div>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          style={{ background: '#111113', border: '1px solid #1c1c20', borderRadius: 16, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
        >
          <AnimatePresence mode="wait">

            {/* ---- LOGIN ---- */}
            {mode === MODES.LOGIN && (
              <motion.div key="login" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', marginBottom: 4, letterSpacing: -0.3 }}>Bem-vindo de volta</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Entre com suas credenciais para acessar o sistema</p>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Email</label>
                    <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="seu@staffingbrasil.com.br" autoComplete="email" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Senha</label>
                    <Field icon={Lock} type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" rightSlot={PasswordToggle} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => switchMode(MODES.RESET)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Esqueci a senha
                    </button>
                  </div>
                  <AnimatePresence>{error && <MessageBox text={error} isError />}</AnimatePresence>
                  <SubmitButton label="Entrar" loadingLabel="Entrando..." />
                </form>
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #1c1c20', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#71717a' }}>Não tem conta? </span>
                  <button onClick={() => switchMode(MODES.REGISTER)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Criar conta
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---- CADASTRO ---- */}
            {mode === MODES.REGISTER && (
              <motion.div key="register" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', marginBottom: 4, letterSpacing: -0.3 }}>Criar conta</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Preencha seus dados para acessar o CRM</p>
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Nome completo</label>
                    <Field icon={User} type="text" value={name} onChange={setName} placeholder="Seu nome" autoComplete="name" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Email</label>
                    <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="seu@email.com.br" autoComplete="email" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>
                      Senha <span style={{ color: '#52525b', fontSize: 11 }}>(mín. 6 caracteres)</span>
                    </label>
                    <Field icon={Lock} type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" rightSlot={PasswordToggle} />
                  </div>
                  <AnimatePresence>{error && <MessageBox text={error} isError />}</AnimatePresence>
                  <AnimatePresence>{info && <MessageBox text={info} isError={false} />}</AnimatePresence>
                  <SubmitButton label="Criar conta" loadingLabel="Criando..." />
                </form>
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #1c1c20', textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#71717a' }}>Já tem conta? </span>
                  <button onClick={() => switchMode(MODES.LOGIN)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Entrar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---- RECUPERAR SENHA ---- */}
            {mode === MODES.RESET && (
              <motion.div key="reset" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', marginBottom: 4 }}>Recuperar senha</h2>
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 24 }}>Informe seu email para receber o link de redefinição</p>
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', display: 'block', marginBottom: 6 }}>Email</label>
                    <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="seu@email.com.br" autoComplete="email" />
                  </div>
                  <AnimatePresence>{error && <MessageBox text={error} isError />}</AnimatePresence>
                  <AnimatePresence>{info && <MessageBox text={info} isError={false} />}</AnimatePresence>
                  <SubmitButton label="Enviar link" loadingLabel="Enviando..." />
                </form>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button onClick={() => switchMode(MODES.LOGIN)}
                    style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ← Voltar ao login
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---- CONFIRMAÇÃO DE EMAIL ---- */}
            {mode === MODES.CONFIRMED && (
              <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    style={{ width: 56, height: 56, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
                  >
                    <CheckCircle size={24} style={{ color: '#22c55e' }} />
                  </motion.div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', marginBottom: 8 }}>Conta criada!</h2>
                  <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, marginBottom: 20 }}>
                    Enviamos um email de confirmação para <strong style={{ color: '#e4e4e7' }}>{email}</strong>.
                    Acesse sua caixa de entrada e clique no link para ativar sua conta.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={handleResend} disabled={loading}
                      style={{ background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#fafafa' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#a1a1aa' }}>
                      {loading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <RefreshCw size={14} />}
                      Reenviar email
                    </button>
                    <AnimatePresence>{info && <MessageBox text={info} isError={false} />}</AnimatePresence>
                    <button onClick={() => switchMode(MODES.LOGIN)}
                      style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Voltar ao login
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', fontSize: 11, color: '#3f3f46', marginTop: 20, lineHeight: 1.6 }}
        >
          Staffing Brasil CRM · Dados protegidos com Supabase Auth
        </motion.p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
