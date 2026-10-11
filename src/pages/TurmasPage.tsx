import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, GraduationCap, MoreHorizontal, Pencil, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { TableSkeleton } from '../components/Loading';
import { api, getErrorMessage, responseArray } from '../lib/api';
import type { Turma } from '../types';

const turmaSchema = z.object({ nome: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(80, 'Use até 80 caracteres.') });
type TurmaFields = z.infer<typeof turmaSchema>;

export function TurmasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCoordinator = user?.role === 'COORDENADOR';
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState<Turma | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TurmaFields>({ resolver: zodResolver(turmaSchema), defaultValues: { nome: '' } });

  const loadTurmas = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await api.get('/turmas');
      setTurmas(responseArray<Turma>(response.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar as turmas.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTurmas(); }, [loadTurmas]);
  useEffect(() => { if (modalOpen) reset({ nome: editing?.nome ?? '' }); }, [modalOpen, editing, reset]);

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(turma: Turma) { setEditing(turma); setModalOpen(true); }

  async function onSubmit(values: TurmaFields) {
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/turmas/${editing.id}`, { nome: values.nome });
        toast.success('Turma atualizada com sucesso.');
      } else {
        await api.post('/turmas', { nome: values.nome });
        toast.success('Turma criada com sucesso.');
      }
      setModalOpen(false);
      await loadTurmas(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!selectedDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/turmas/${selectedDelete.id}`);
      toast.success('Turma excluída com sucesso.');
      setSelectedDelete(null);
      await loadTurmas(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível excluir a turma.'));
    } finally {
      setDeleting(false);
    }
  }

  const filtered = turmas.filter((turma) => turma.nome.toLowerCase().includes(search.trim().toLowerCase()));

  return <div className="page-stack">
    <section className="page-title-row"><div><div className="eyebrow">ORGANIZAÇÃO ACADÊMICA</div><h1>Turmas</h1><p>{isCoordinator ? 'Gerencie as turmas e os professores vinculados.' : 'Consulte as turmas às quais você está vinculado.'}</p></div>{isCoordinator && <button className="btn btn-primary" onClick={openCreate} type="button"><Plus size={18}/> Nova turma</button>}</section>

    <section className="panel table-panel">
      <div className="list-toolbar"><div className="list-toolbar-title"><div className="panel-icon purple-icon"><GraduationCap size={19}/></div><div><h2>{isCoordinator ? 'Todas as turmas' : 'Minhas turmas'}</h2><p>{loading ? 'Buscando informações...' : `${turmas.length} ${turmas.length === 1 ? 'turma encontrada' : 'turmas encontradas'}`}</p></div></div><div className="search-field"><Search size={17}/><input aria-label="Buscar turma" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar turma..." /></div></div>
      {loading ? <TableSkeleton/> : filtered.length === 0 ? <EmptyState title={search ? 'Nenhuma turma encontrada' : 'Ainda não há turmas'} description={search ? 'Tente buscar pelo nome de outra turma.' : isCoordinator ? 'Cadastre a primeira turma para começar a organizar as provas.' : 'Quando você for vinculado a uma turma, ela aparecerá aqui.'} action={isCoordinator && !search ? <button className="btn btn-primary btn-sm" onClick={openCreate} type="button"><Plus size={16}/> Nova turma</button> : undefined}/> : isCoordinator ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Nome da turma</th><th>Professores</th><th>Provas</th><th className="text-right">Ações</th></tr></thead><tbody>{filtered.map((turma) => <tr key={turma.id}><td><div className="table-primary-cell"><div className="table-avatar avatar-purple"><GraduationCap size={18}/></div><div><strong>{turma.nome}</strong><span>ID: {turma.id.slice(0, 8)}…</span></div></div></td><td><span className="count-chip"><UsersRound size={14}/>{turma._count?.professores ?? turma.professores?.length ?? 0}</span></td><td><span className="count-chip"><span className="count-dot"/>{turma._count?.provas ?? 0}</span></td><td><div className="table-actions"><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/turmas/${turma.id}`)} type="button">Detalhes <ArrowRight size={15}/></button><button className="icon-button" onClick={() => openEdit(turma)} aria-label={`Editar ${turma.nome}`} title="Editar turma" type="button"><Pencil size={16}/></button><button className="icon-button icon-danger" onClick={() => setSelectedDelete(turma)} aria-label={`Excluir ${turma.nome}`} title="Excluir turma" type="button"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div> : <div className="class-card-grid">{filtered.map((turma) => <article className="class-card" key={turma.id}><div className="class-card-top"><div className="table-avatar avatar-blue"><GraduationCap size={20}/></div><span className="class-card-kicker">TURMA</span></div><h3>{turma.nome}</h3><div className="class-card-metrics"><span><UsersRound size={15}/> {turma._count?.professores ?? turma.professores?.length ?? 0} professores</span><span><span className="count-dot"/> {turma._count?.provas ?? 0} provas</span></div><div className="class-card-footer"><span>Vínculo escolar</span><MoreHorizontal size={18}/></div></article>)}</div>}
    </section>

    <Modal open={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editing ? 'Editar turma' : 'Nova turma'} subtitle={editing ? 'Atualize o nome da turma.' : 'Cadastre uma turma para organizar os vínculos e as provas.'}>
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <div className="field-group"><label htmlFor="nome-turma">Nome da turma</label><input className={`text-input ${errors.nome ? 'input-invalid' : ''}`} id="nome-turma" placeholder="Ex.: 8º ano A" autoFocus {...register('nome')}/>{errors.nome && <small className="field-error">{errors.nome.message}</small>}</div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={submitting} type="button">Cancelar</button><button className="btn btn-primary" disabled={submitting} type="submit">{submitting ? <><span className="spinner spinner-white"/> Salvando...</> : editing ? 'Salvar alterações' : 'Criar turma'}</button></div>
      </form>
    </Modal>

    <ConfirmDialog open={Boolean(selectedDelete)} title="Excluir turma?" description={`Você está prestes a excluir a turma “${selectedDelete?.nome ?? ''}”. Essa ação não pode ser desfeita.`} loading={deleting} onCancel={() => setSelectedDelete(null)} onConfirm={() => void confirmDelete()}/>
  </div>;
}
