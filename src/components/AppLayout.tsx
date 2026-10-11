import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpenCheck, ChevronRight, ClipboardList, GraduationCap, LayoutDashboard, LogOut, School, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { initials, roleLabel } from '../lib/utils';
import { Toaster } from 'sonner';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCoordinator = user?.role === 'COORDENADOR';
  const pageName = location.pathname.startsWith('/turmas/') ? 'Detalhes da turma' : location.pathname === '/turmas' ? 'Turmas' : location.pathname === '/provas' ? 'Provas' : 'Visão geral';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><BookOpenCheck size={23} strokeWidth={2.2} /></div>
        <div><strong>provas<span>.</span></strong><small>GESTÃO ESCOLAR</small></div>
      </div>
      <div className="school-pill"><div className="school-pill-icon"><School size={17} /></div><div><span>Ambiente escolar</span><strong>{isCoordinator ? 'Coordenação' : 'Área do professor'}</strong></div></div>
      <div className="sidebar-section-label">MENU PRINCIPAL</div>
      <nav className="nav-links" aria-label="Navegação principal">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={19} /><span>Visão geral</span>{location.pathname === '/' && <ChevronRight size={15} className="nav-chevron" />}</NavLink>
        <NavLink to="/provas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><ClipboardList size={19} /><span>Provas</span>{location.pathname === '/provas' && <ChevronRight size={15} className="nav-chevron" />}</NavLink>
        <NavLink to="/turmas" className={({ isActive }) => `nav-link ${isActive || location.pathname.startsWith('/turmas/') ? 'active' : ''}`}><GraduationCap size={19} /><span>Turmas</span>{location.pathname.startsWith('/turmas') && <ChevronRight size={15} className="nav-chevron" />}</NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="security-note"><div className="security-icon"><ShieldCheck size={18} /></div><div><strong>Acesso protegido</strong><span>Seus dados são privados e seguros.</span></div></div>
        <button className="sidebar-logout" onClick={handleLogout} type="button"><LogOut size={18} /><span>Sair da conta</span></button>
        <div className="sidebar-version">Sistema de Gestão de Provas <span>v1.0</span></div>
      </div>
    </aside>

    <div className="main-column">
      <header className="topbar">
        <div className="breadcrumb"><span>Início</span><ChevronRight size={14} /><strong>{pageName}</strong></div>
        <div className="topbar-user"><div className="user-avatar">{initials(user?.name)}</div><div className="user-meta"><strong>{user?.name ?? 'Usuário'}</strong><span>{roleLabel(user?.role)}</span></div><span className={`role-dot ${isCoordinator ? 'dot-violet' : ''}`} /></div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>© {new Date().getFullYear()} Provas. Gestão escolar simplificada.</span><span>Feito para organizar o aprendizado.</span></footer>
    </div>
    <Toaster position="top-right" richColors closeButton />
  </div>;
}
