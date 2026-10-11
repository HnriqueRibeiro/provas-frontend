import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, GraduationCap, Mail, Plus, Trash2, UserRoundPlus, UsersRound } from 'lucide-react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { PageLoading } from '../components/Loading';
import { api, getErrorMessage, responseArray } from '../lib/api';
import { initials } from '../lib/utils';
import type { ProfessorResumo, Turma } from '../types';

export function TurmaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCoordinator = user?.role === 'COORDENADOR';
  const [turma, setTurma] = useState<Turma | null>(null);
  const [professores, setProfessores] = useState<ProfessorResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProfessores, setAllProfessores] = useState<ProfessorResumo[]>([]);
  const [professorId, setProfessorId] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedRemove, setSelectedRemove] = useState<ProfessorResumo | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadDetails = useCallback(async (quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);
    try {
      const [turmaResponse, professoresResponse] = await Promise.all([
        api.get(`/turmas/${id}`),
        api.get('/users/professores'),
      ]);
      const turmaData = (turmaResponse.data?.data ?? turmaResponse.data) as Turma;
      setTurma(turmaData);
      setProfessores(turmaData.professores ?? []);
      setAllProfessores(responseArray<ProfessorResumo>(professoresResponse.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar os detalhes da turma.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);
  if (!isCoordinator) return <Navigate to="/turmas" replace />;

  const linkedIds = new Set(professores.map((professor) => professor.id));
  const availableProfessores = allProfessores.filter((professor) => !linkedIds.has(professor.id));

  async function addProfessor() {
    if (!id || !professorId) {
      toast.error('Selecione um professor para vincular à turma.');
      return;
    }
    setAdding(true);
    try {
      await api.post(`/turmas/${id}/professores`, { professorId });
      toast.success('Professor vinculado à turma.');
      setProfessorId('');
      await loadDetails(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível vincular o professor.'));
    } finally {
      setAdding(false);
    }
  }

  async function confirmRemove() {
    if (!id || !selectedRemove) return;
    setRemoving(true);
    try {
      await api.delete(`/turmas/${id}/professores/${selectedRemove.id}`);
      toast.success('Professor desvinculado da turma.');
      setSelectedRemove(null);
      await loadDetails(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível desvincular o professor.'));
    } finally {
      setRemoving(false);
    }
  }

  return <div className="page-stack">
    <button className="back-link" type="button" onClick={() => navigate('/turmas')}><ArrowLeft size={17}/> Voltar para turmas</button>
    {loading ? <PageLoading label="Carregando detalhes da turma..."/> : !turma ? <EmptyState title="Turma não encontrada" description="Não foi possível encontrar os dados desta turma. Volte à lista e tente novamente." action={<button className="btn btn-secondary btn-sm" onClick={() => navigate('/turmas')} type="button">Voltar para turmas</button>}/> : <>
      <section className="turma-detail-hero"><div className="detail-tile"><GraduationCap size={27}/></div><div className="detail-hero-main"><div className="eyebrow">DETALHES DA TURMA</div><h1>{turma.nome}</h1><p>Gerencie os professores que podem acessar esta turma.</p></div><div className="detail-hero-count"><span>{professores.length}</span><small>{professores.length === 1 ? 'professor vinculado' : 'professores vinculados'}</small></div></section>
      <section className="panel">
        <div className="panel-heading panel-heading-wrap"><div><h2>Professores vinculados</h2><p>Somente professores vinculados podem acessar esta turma.</p></div><span className="count-chip"><UsersRound size={14}/>{professores.length} vinculados</span></div>
        <div className="link-professor-box"><div className="link-professor-icon"><UserRoundPlus size={20}/></div><div className="link-professor-copy"><strong>Adicionar professor</strong><span>Selecione um professor da sua escola para vincular.</span></div><div className="link-professor-controls"><select aria-label="Selecionar professor" value={professorId} onChange={(event) => setProfessorId(event.target.value)} className="text-input select-input" disabled={availableProfessores.length === 0}><option value="">{availableProfessores.length === 0 ? 'Todos já estão vinculados' : 'Selecione um professor...'}</option>{availableProfessores.map((professor) => <option key={professor.id} value={professor.id}>{professor.name} · {professor.email}</option>)}</select><button className="btn btn-primary" disabled={!professorId || adding || availableProfessores.length === 0} onClick={() => void addProfessor()} type="button">{adding ? <><span className="spinner spinner-white"/> Adicionando...</> : <><Plus size={17}/> Adicionar</>}</button></div></div>
        {professores.length === 0 ? <EmptyState title="Nenhum professor vinculado" description="Use o seletor acima para adicionar o primeiro professor a esta turma."/> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Professor</th><th>E-mail</th><th className="text-right">Ação</th></tr></thead><tbody>{professores.map((professor) => <tr key={professor.id}><td><div className="table-primary-cell"><div className="user-avatar small-avatar">{initials(professor.name)}</div><div><strong>{professor.name}</strong><span>Professor</span></div></div></td><td><span className="email-cell"><Mail size={15}/>{professor.email}</span></td><td><div className="table-actions"><button className="btn btn-danger-soft btn-sm" type="button" onClick={() => setSelectedRemove(professor)}><Trash2 size={15}/> Desvincular</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </>}
    <ConfirmDialog open={Boolean(selectedRemove)} title="Desvincular professor?" description={`“${selectedRemove?.name ?? ''}” deixará de estar vinculado a esta turma. As permissões serão atualizadas pelo backend.`} confirmLabel="Desvincular" loading={removing} onCancel={() => setSelectedRemove(null)} onConfirm={() => void confirmRemove()}/>
  </div>;
}
