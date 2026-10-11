export type Role = 'PROFESSOR' | 'COORDENADOR';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  data_nascimento?: string;
  sexo?: 'MASCULINO' | 'FEMININO' | string;
  role: Role;
  escolaId: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface ProfessorResumo {
  id: string;
  name: string;
  email: string;
}

export interface Turma {
  id: string;
  nome: string;
  _count?: {
    professores?: number;
    provas?: number;
  };
  professores?: ProfessorResumo[];
  created_at?: string;
  updated_at?: string;
}

export type Bimestre = 'PRIMEIRO' | 'SEGUNDO' | 'TERCEIRO' | 'QUARTO';
export type StatusProva = 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';

export interface Prova {
  id: string;
  titulo: string;
  descricao?: string | null;
  bimestre: Bimestre;
  anoLetivo: string | number;
  status: StatusProva;
  turmaId?: string;
  professorId?: string;
  arquivo_url?: string | null;
  turma?: { nome: string } | null;
  professor?: { name: string } | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}
