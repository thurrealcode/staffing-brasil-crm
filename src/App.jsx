import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { canAccess } from './lib/permissions'
import AppLayout from './layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Empresas from './pages/Empresas'
import Candidatos from './pages/Candidatos'
import Pipeline from './pages/Pipeline'
import Agenda from './pages/Agenda'
import Mensagens from './pages/Mensagens'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import IA from './pages/IA'
import Prospeccao from './pages/Prospeccao'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#71717a', fontSize: 14 }}>Carregando...</span>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

// Bloqueia acesso direto pela URL conforme role do usuário
function RoleRoute({ page, children }) {
  const { user } = useAuth()
  if (!canAccess(user?.role, page)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<RoleRoute page="dashboard">    <Dashboard />    </RoleRoute>} />
        <Route path="prospeccao"    element={<RoleRoute page="prospeccao">   <Prospeccao />   </RoleRoute>} />
        <Route path="leads"         element={<RoleRoute page="leads">        <Leads />        </RoleRoute>} />
        <Route path="empresas"      element={<RoleRoute page="empresas">     <Empresas />     </RoleRoute>} />
        <Route path="candidatos"    element={<RoleRoute page="candidatos">   <Candidatos />   </RoleRoute>} />
        <Route path="pipeline"      element={<RoleRoute page="pipeline">     <Pipeline />     </RoleRoute>} />
        <Route path="agenda"        element={<RoleRoute page="agenda">       <Agenda />       </RoleRoute>} />
        <Route path="mensagens"     element={<RoleRoute page="mensagens">    <Mensagens />    </RoleRoute>} />
        <Route path="relatorios"    element={<RoleRoute page="relatorios">   <Relatorios />   </RoleRoute>} />
        <Route path="ia"            element={<RoleRoute page="ia">           <IA />           </RoleRoute>} />
        <Route path="configuracoes" element={<RoleRoute page="configuracoes"><Configuracoes /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
