import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpenCheck, ClipboardList, GraduationCap, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { api, getErrorMessage, responseArray } from '../lib/api';
import { formatDate, roleLabel } from '../lib/utils';
import type { Prova, Turma } from '../types';
import { PageLoading } from '../components/Loading';

export function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const [provasResult, turmasResult] = await Promise.allSettled([api.get('/provas'), api.get('/turmas')]);
      if (!active) return;
      if (provasResult.status === 'fulfilled') setProvas(responseArray<Prova>(provasResult.value.data));
      else toast.error(getErrorMessage(provasResult.reason, 'Não foi possível carregar as provas.'));
      if (turmasResult.status === 'fulfilled') setTurmas(responseArray<Turma>(turmasResult.value.data));
      else toast.error(getErrorMessage(turmasResult.reason, 'Não foi possível carregar as turmas.'));
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const isCoordinator = user?.role === 'COORDENADOR';
  const currentProvas = [...provas].sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()).slice(0, 5);

  return <div className="page-stack">
    <section className="welcome-banner">
      <div className="welcome-banner-copy"><div className="banner-eyebrow"><Sparkles size={14} /> SEU ESPAÇO DE TRABALHO</div><h1>Olá, {user?.name?.trim().split(/\s+/)[0] || 'tudo bem'}! <span className="wave">✦</span></h1><p>{isCoordinator ? 'Acompanhe as turmas e mantenha as provas da sua escola organizadas.' : 'Suas turmas e provas em um espaço simples para consultar e organizar.'}</p><div className="banner-note"><ShieldCheck size={15} /> Acesso seguro · {roleLabel(user?.role)}</div></div>
      <div className="banner-illustration" aria-hidden="true"><div className="illustration-back-circle"/><div className="illustration-paper paper-back"><span/><span/><span/></div><div className="illustration-paper paper-front"><div className="paper-check"><BookOpenCheck size={28}/></div><strong>Provas</strong><span className="paper-line long"/><span className="paper-line"/><span className="paper-line short"/><div className="paper-stamp">OK</div></div><div className="illustration-spark spark-one">✦</div><div className="illustration-spark spark-two">✧</div></div>
    </section>

    <div className="section-heading"><div><h2>Resumo da sua escola</h2><p>Uma visão rápida do que está acontecendo.</p></div><span className="subtle-label">ATUALIZADO AGORA</span></div>
    {loading ? <PageLoading label="Carregando seu resumo..." /> : <div className="stats-grid">
      <button className="stat-card" onClick={() => navigate('/provas')} type="button"><div className="stat-top"><span className="stat-icon stat-purple"><ClipboardList size={20}/></span><span className="stat-trend">Ver provas <ArrowUpRight size={14}/></span></div><div className="stat-number">{provas.length}</div><div className="stat-label">{isCoordinator ? 'Provas da escola' : 'Minhas provas'}</div><div className="stat-footer"><span className="stat-footer-dot purple-dot"/> Arquivos cadastrados</div></button>
      <button className="stat-card" onClick={() => navigate('/turmas')} type="button"><div className="stat-top"><span className="stat-icon stat-blue"><GraduationCap size={21}/></span><span className="stat-trend">Ver turmas <ArrowUpRight size={14}/></span></div><div className="stat-number">{turmas.length}</div><div className="stat-label">{isCoordinator ? 'Turmas cadastradas' : 'Turmas vinculadas'}</div><div className="stat-footer"><span className="stat-footer-dot blue-dot"/> Organização acadêmica</div></button>
      <button className="stat-card" onClick={() => navigate('/provas')} type="button"><div className="stat-top"><span className="stat-icon stat-green"><BookOpenCheck size={20}/></span><span className="stat-trend">Consultar <ArrowUpRight size={14}/></span></div><div className="stat-number">{provas.filter((prova) => prova.status === 'CONCLUIDA').length}</div><div className="stat-label">Provas concluídas</div><div className="stat-footer"><span className="stat-footer-dot green-dot"/> Conforme o status da API</div></button>
    </div>}

    <div className="content-grid">
      <section className="panel recent-panel"><div className="panel-heading"><div><h2>Provas recentes</h2><p>Últimos arquivos cadastrados.</p></div><button className="text-link" type="button" onClick={() => navigate('/provas')}>Ver todas <ArrowRight size={15}/></button></div>
        {loading ? <div className="recent-loading"><PageLoading label="Buscando provas..."/></div> : currentProvas.length === 0 ? <div className="recent-empty"><div className="empty-mini-icon"><ClipboardList size={22}/></div><strong>Nenhuma prova cadastrada ainda</strong><span>Quando houver provas, elas aparecerão aqui.</span><button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate('/provas')}>Acessar provas</button></div> : <div className="recent-list">{currentProvas.map((prova) => <div className="recent-item" key={prova.id}><div className="recent-file-icon"><ClipboardList size={18}/></div><div className="recent-item-main"><strong>{prova.titulo}</strong><span>{prova.turma?.nome || 'Turma não informada'} · {prova.bimestre ? prova.bimestre.toLowerCase().replace('primeiro', '1º').replace('segundo', '2º').replace('terceiro', '3º').replace('quarto', '4º').replace(' bimestre', ' bimestre') : 'Bimestre não informado'}</span></div><div className="recent-item-date">{formatDate(prova.created_at || prova.createdAt)}</div></div>)}</div>}
      </section>
      <section className="panel quick-panel"><div className="panel-heading"><div><h2>Acesso rápido</h2><p>O que você precisa fazer?</p></div></div>
        <button className="quick-action" type="button" onClick={() => navigate('/provas')}><div className="quick-action-icon quick-purple"><ClipboardList size={19}/></div><div><strong>Consultar provas</strong><span>Encontre e baixe arquivos.</span></div><ArrowRight size={17} className="quick-arrow"/></button>
        <button className="quick-action" type="button" onClick={() => navigate('/turmas')}><div className="quick-action-icon quick-blue"><GraduationCap size={20}/></div><div><strong>Ver turmas</strong><span>{isCoordinator ? 'Organize turmas e professores.' : 'Consulte suas turmas vinculadas.'}</span></div><ArrowRight size={17} className="quick-arrow"/></button>
        {!isCoordinator && <button className="quick-action" type="button" onClick={() => navigate('/provas?novo=1')}><div className="quick-action-icon quick-green"><UploadCloud size={19}/></div><div><strong>Enviar uma prova</strong><span>Adicione um novo arquivo.</span></div><ArrowRight size={17} className="quick-arrow"/></button>}
        {isCoordinator && <div className="coordinator-hint"><div><ShieldCheck size={17}/></div><p><strong>Perfil de coordenação</strong><br/>Você pode gerenciar turmas e consultar todas as provas da escola.</p></div>}
      </section>
    </div>
  </div>;
}
