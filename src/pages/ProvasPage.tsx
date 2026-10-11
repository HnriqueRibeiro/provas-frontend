import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, CalendarDays, CheckCircle2, ClipboardList, Eye, FileImage, FileText, FileUp, Filter, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageLoading, TableSkeleton } from '../components/Loading';
import { api, getErrorMessage, responseArray } from '../lib/api';
import { bimestreLabel, formatDate, statusLabel } from '../lib/utils';
import type { Bimestre, Prova, StatusProva, Turma } from '../types';

const bimestres: Bimestre[] = ['PRIMEIRO', 'SEGUNDO', 'TERCEIRO', 'QUARTO'];
const provaSchema = z.object({
  titulo: z.string().trim().min(3, 'O título deve ter pelo menos 3 caracteres.').max(120, 'Use até 120 caracteres.'),
  descricao: z.string().trim().min(1, 'Informe uma descrição.').max(500, 'Use até 500 caracteres.'),
  turmaId: z.string().min(1, 'Selecione uma turma.'),
  bimestre: z.enum(['PRIMEIRO', 'SEGUNDO', 'TERCEIRO', 'QUARTO'], { errorMap: () => ({ message: 'Selecione o bimestre.' }) }),
  anoLetivo: z.string().trim().regex(/^\d{4}$/, 'Informe o ano com 4 dígitos.'),
});
type ProvaFields = z.infer<typeof provaSchema>;
const allowedExtensions = ['.jpg', '.png', '.pdf', '.doc', '.docx'];
const maxFileSize = 3 * 1024 * 1024;

function getProvaRecord(data: unknown): Prova {
  if (data && typeof data === 'object' && 'data' in data && (data as { data: unknown }).data) return (data as { data: Prova }).data;
  return data as Prova;
}

function StatusPill({ status }: { status?: StatusProva }) {
  const value = status || 'PENDENTE';
  const className = value === 'CONCLUIDA' ? 'status-done' : value === 'CANCELADA' ? 'status-cancelled' : 'status-pending';
  return <span className={`status-pill ${className}`}><span/>{statusLabel[value] ?? 'Pendente'}</span>;
}

function FileTypeIcon({ filename }: { filename?: string | null }) {
  const extension = filename?.split('.').pop()?.toLowerCase();
  return extension === 'jpg' || extension === 'png' ? <FileImage size={18}/> : <FileText size={18}/>;
}

export function ProvasPage() {
  const { user } = useAuth();
  const isProfessor = user?.role === 'PROFESSOR';
  const [searchParams, setSearchParams] = useSearchParams();
  const [provas, setProvas] = useState<Prova[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedDelete, setSelectedDelete] = useState<Prova | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<Prova | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProvaFields>({
    resolver: zodResolver(provaSchema),
    defaultValues: { titulo: '', descricao: '', turmaId: '', bimestre: 'PRIMEIRO', anoLetivo: String(new Date().getFullYear()) },
  });

  const loadProvas = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await api.get('/provas');
      setProvas(responseArray<Prova>(response.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar as provas.'));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProvas(); }, [loadProvas]);
  useEffect(() => {
    if (isProfessor) {
      api.get('/turmas').then((response) => setTurmas(responseArray<Turma>(response.data))).catch((error) => toast.error(getErrorMessage(error, 'Não foi possível carregar as turmas para o formulário.')));
    }
  }, [isProfessor]);
  useEffect(() => {
    if (searchParams.get('novo') === '1' && isProfessor) {
      setUploadOpen(true);
      setSearchParams((params) => { params.delete('novo'); return params; }, { replace: true });
    }
  }, [searchParams, isProfessor, setSearchParams]);
  useEffect(() => {
    if (uploadOpen) reset({ titulo: '', descricao: '', turmaId: '', bimestre: 'PRIMEIRO', anoLetivo: String(new Date().getFullYear()) });
    if (!uploadOpen) { setFile(null); setFileInputKey((key) => key + 1); }
  }, [uploadOpen, reset]);

  const filtered = useMemo(() => provas.filter((prova) => {
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || [prova.titulo, prova.descricao, prova.turma?.nome, prova.professor?.name].some((value) => String(value ?? '').toLowerCase().includes(needle));
    const matchesStatus = statusFilter === 'TODOS' || prova.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [provas, search, statusFilter]);

  function handleFileChange(nextFile?: File) {
    if (!nextFile) { setFile(null); return; }
    const extension = `.${nextFile.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!allowedExtensions.includes(extension)) {
      toast.error('Formato não permitido. Envie JPG, PNG, PDF, DOC ou DOCX.');
      setFile(null); setFileInputKey((key) => key + 1); return;
    }
    if (nextFile.size > maxFileSize) {
      toast.error('O arquivo ultrapassa o limite de 3 MB.');
      setFile(null); setFileInputKey((key) => key + 1); return;
    }
    setFile(nextFile);
  }

  async function onUpload(values: ProvaFields) {
    if (!file) {
      toast.error('Selecione o arquivo da prova antes de enviar.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('titulo', values.titulo);
    formData.append('descricao', values.descricao);
    formData.append('bimestre', values.bimestre);
    formData.append('anoLetivo', values.anoLetivo);
    formData.append('turmaId', values.turmaId);
    formData.append('arquivo', file);
    try {
      // O FormData é enviado como multipart/form-data; o navegador/Axios gera o boundary correto.
      await api.post('/provas', formData);
      toast.success('Prova enviada com sucesso.');
      setUploadOpen(false);
      await loadProvas(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível enviar a prova.'));
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!selectedDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/provas/${selectedDelete.id}`);
      toast.success('Prova excluída com sucesso.');
      setSelectedDelete(null);
      await loadProvas(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível excluir a prova.'));
    } finally {
      setDeleting(false);
    }
  }

  async function openDetails(prova: Prova) {
    setDetailsOpen(true); setDetailsLoading(true); setSelectedDetails(prova);
    try {
      const response = await api.get(`/provas/${prova.id}`);
      setSelectedDetails(getProvaRecord(response.data));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível carregar os detalhes da prova.'));
    } finally {
      setDetailsLoading(false);
    }
  }

  return <div className="page-stack">
    <section className="page-title-row"><div><div className="eyebrow">ACERVO ACADÊMICO</div><h1>Provas</h1><p>{isProfessor ? 'Organize seus arquivos e envie novas provas para suas turmas.' : 'Consulte, visualize e baixe as provas cadastradas pela sua escola.'}</p></div>{isProfessor && <button className="btn btn-primary" onClick={() => setUploadOpen(true)} type="button"><UploadCloud size={18}/> Fazer upload de prova</button>}</section>

    <section className="panel table-panel">
      <div className="list-toolbar"><div className="list-toolbar-title"><div className="panel-icon green-icon"><ClipboardList size={19}/></div><div><h2>{isProfessor ? 'Minhas provas' : 'Todas as provas'}</h2><p>{loading ? 'Buscando arquivos...' : `${provas.length} ${provas.length === 1 ? 'prova cadastrada' : 'provas cadastradas'}`}</p></div></div><div className="toolbar-filters"><div className="search-field"><Search size={17}/><input aria-label="Buscar prova" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, turma..." /></div><div className="filter-field"><Filter size={16}/><select aria-label="Filtrar pelo status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="TODOS">Todos os status</option><option value="PENDENTE">Pendente</option><option value="CONCLUIDA">Concluída</option><option value="CANCELADA">Cancelada</option></select></div></div></div>
      {loading ? <TableSkeleton rows={5}/> : filtered.length === 0 ? <EmptyState title={search || statusFilter !== 'TODOS' ? 'Nenhuma prova encontrada' : 'Seu acervo está vazio'} description={search || statusFilter !== 'TODOS' ? 'Tente ajustar a busca ou o filtro de status.' : isProfessor ? 'Envie a primeira prova para começar a montar seu acervo.' : 'Quando os professores enviarem provas, elas aparecerão aqui.'} action={isProfessor && !search && statusFilter === 'TODOS' ? <button className="btn btn-primary btn-sm" onClick={() => setUploadOpen(true)} type="button"><Plus size={16}/> Enviar primeira prova</button> : undefined}/> : <div className="table-scroll"><table className="data-table exam-table"><thead><tr><th>Prova</th><th>Turma</th>{!isProfessor && <th>Professor</th>}<th>Período</th><th>Data</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>{filtered.map((prova) => <tr key={prova.id}><td><button className="exam-title-button" type="button" onClick={() => void openDetails(prova)}><span className="file-type-icon"><FileTypeIcon filename={prova.arquivo_url}/></span><span><strong>{prova.titulo}</strong><small>{prova.descricao || 'Sem descrição'}</small></span></button></td><td><span className="table-plain-text">{prova.turma?.nome || '—'}</span></td>{!isProfessor && <td><span className="table-plain-text">{prova.professor?.name || '—'}</span></td>}<td><span className="term-chip">{bimestreLabel[prova.bimestre] ?? prova.bimestre}</span><small className="year-text">Ano {prova.anoLetivo || '—'}</small></td><td><span className="date-cell"><CalendarDays size={14}/>{formatDate(prova.created_at || prova.createdAt)}</span></td><td><StatusPill status={prova.status}/></td><td><div className="table-actions"><button className="icon-button" onClick={() => void openDetails(prova)} type="button" aria-label={`Ver detalhes de ${prova.titulo}`} title="Detalhes"><Eye size={16}/></button>{prova.arquivo_url && <a className="icon-button download-action" href={prova.arquivo_url} target="_blank" rel="noopener noreferrer" aria-label={`Baixar ${prova.titulo}`} title="Baixar arquivo"><ArrowDownToLine size={17}/></a>}<button className="icon-button icon-danger" onClick={() => setSelectedDelete(prova)} type="button" aria-label={`Excluir ${prova.titulo}`} title="Excluir prova"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
      {!loading && filtered.length > 0 && <div className="table-footer"><span>Exibindo <strong>{filtered.length}</strong> de <strong>{provas.length}</strong> provas</span><span>Os arquivos são armazenados no serviço configurado pelo backend.</span></div>}
    </section>

    <Modal open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} title="Enviar nova prova" subtitle="Preencha os dados abaixo e anexe o arquivo da avaliação." width="lg">
      <form className="form-stack" onSubmit={handleSubmit(onUpload)}>
        <div className="form-grid-two"><div className="field-group"><label htmlFor="prova-titulo">Título da prova <span className="required-star">*</span></label><input id="prova-titulo" className={`text-input ${errors.titulo ? 'input-invalid' : ''}`} placeholder="Ex.: Avaliação de Matemática" {...register('titulo')}/>{errors.titulo && <small className="field-error">{errors.titulo.message}</small>}</div><div className="field-group"><label htmlFor="prova-turma">Turma <span className="required-star">*</span></label><select id="prova-turma" className={`text-input select-input ${errors.turmaId ? 'input-invalid' : ''}`} {...register('turmaId')}><option value="">Selecione uma turma...</option>{turmas.map((turma) => <option value={turma.id} key={turma.id}>{turma.nome}</option>)}</select>{errors.turmaId && <small className="field-error">{errors.turmaId.message}</small>}{turmas.length === 0 && <small className="field-hint">Nenhuma turma disponível. Peça à coordenação para vincular você a uma turma.</small>}</div></div>
        <div className="field-group"><label htmlFor="prova-descricao">Descrição <span className="required-star">*</span></label><textarea id="prova-descricao" className={`text-input textarea-input ${errors.descricao ? 'input-invalid' : ''}`} rows={3} placeholder="Inclua detalhes úteis sobre a avaliação..." {...register('descricao')}/>{errors.descricao && <small className="field-error">{errors.descricao.message}</small>}</div>
        <div className="form-grid-two"><div className="field-group"><label htmlFor="prova-bimestre">Bimestre <span className="required-star">*</span></label><select id="prova-bimestre" className={`text-input select-input ${errors.bimestre ? 'input-invalid' : ''}`} {...register('bimestre')}>{bimestres.map((bimestre) => <option value={bimestre} key={bimestre}>{bimestreLabel[bimestre]}</option>)}</select>{errors.bimestre && <small className="field-error">{errors.bimestre.message}</small>}</div><div className="field-group"><label htmlFor="prova-ano">Ano letivo <span className="required-star">*</span></label><input id="prova-ano" className={`text-input ${errors.anoLetivo ? 'input-invalid' : ''}`} inputMode="numeric" maxLength={4} placeholder="2026" {...register('anoLetivo')}/>{errors.anoLetivo && <small className="field-error">{errors.anoLetivo.message}</small>}</div></div>
        <div className="field-group"><label>Arquivo da prova <span className="required-star">*</span></label><label className={`upload-dropzone ${file ? 'has-file' : ''}`} htmlFor="prova-arquivo"><input key={fileInputKey} id="prova-arquivo" type="file" accept=".jpg,.png,.pdf,.doc,.docx" onChange={(event) => handleFileChange(event.target.files?.[0])}/>{file ? <><div className="upload-file-icon"><FileText size={25}/></div><div className="upload-drop-copy"><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Arquivo pronto para envio</span></div><span className="file-ready"><CheckCircle2 size={17}/></span></> : <><div className="upload-cloud-icon"><UploadCloud size={25}/></div><div className="upload-drop-copy"><strong>Clique para escolher um arquivo</strong><span>ou selecione um arquivo no seu dispositivo</span></div><div className="upload-supported">JPG, PNG, PDF, DOC, DOCX<span>Máximo de 3 MB</span></div></>}</label>{file && <button className="remove-file-link" type="button" onClick={() => { setFile(null); setFileInputKey((key) => key + 1); }}><X size={14}/> Remover arquivo</button>}<small className="field-hint">O nome do campo enviado à API será <code>arquivo</code>.</small></div>
        <div className="modal-actions"><button className="btn btn-secondary" type="button" disabled={uploading} onClick={() => setUploadOpen(false)}>Cancelar</button><button className="btn btn-primary" type="submit" disabled={uploading || turmas.length === 0}>{uploading ? <><span className="spinner spinner-white"/> Enviando arquivo...</> : <><FileUp size={17}/> Enviar prova</>}</button></div>
      </form>
    </Modal>

    <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Detalhes da prova" subtitle="Informações retornadas pela API.">
      {detailsLoading ? <PageLoading label="Carregando detalhes..."/> : selectedDetails ? <div className="detail-content"><div className="detail-file-heading"><div className="detail-file-icon"><FileTypeIcon filename={selectedDetails.arquivo_url}/></div><div><h3>{selectedDetails.titulo}</h3><span>{selectedDetails.descricao || 'Sem descrição informada.'}</span></div></div><div className="detail-info-grid"><div><span>Turma</span><strong>{selectedDetails.turma?.nome || '—'}</strong></div><div><span>Professor</span><strong>{selectedDetails.professor?.name || '—'}</strong></div><div><span>Bimestre</span><strong>{bimestreLabel[selectedDetails.bimestre] ?? selectedDetails.bimestre}</strong></div><div><span>Ano letivo</span><strong>{selectedDetails.anoLetivo || '—'}</strong></div><div><span>Data de cadastro</span><strong>{formatDate(selectedDetails.created_at || selectedDetails.createdAt)}</strong></div><div><span>Status</span><strong><StatusPill status={selectedDetails.status}/></strong></div></div>{selectedDetails.arquivo_url ? <a className="btn btn-primary detail-download" href={selectedDetails.arquivo_url} target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={17}/> Visualizar / baixar arquivo</a> : <p className="field-hint">Esta prova não retornou um link de arquivo.</p>}</div> : <EmptyState title="Detalhes indisponíveis" description="Não foi possível carregar os dados desta prova."/>}
    </Modal>
    <ConfirmDialog open={Boolean(selectedDelete)} title="Excluir prova?" description={`A prova “${selectedDelete?.titulo ?? ''}” será excluída. Essa ação não pode ser desfeita.`} loading={deleting} onCancel={() => setSelectedDelete(null)} onConfirm={() => void confirmDelete()}/>
  </div>;
}
