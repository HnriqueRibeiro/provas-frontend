import type { Bimestre, StatusProva } from '../types';

export const bimestreLabel: Record<Bimestre, string> = {
  PRIMEIRO: '1º bimestre',
  SEGUNDO: '2º bimestre',
  TERCEIRO: '3º bimestre',
  QUARTO: '4º bimestre',
};

export const statusLabel: Record<StatusProva, string> = {
  PENDENTE: 'Pendente',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function initials(name?: string) {
  if (!name) return 'U';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function roleLabel(role?: string) {
  return role === 'COORDENADOR' ? 'Coordenador' : 'Professor';
}

export function errorToText(value: unknown) {
  return value instanceof Error ? value.message : 'Ocorreu um erro inesperado.';
}
