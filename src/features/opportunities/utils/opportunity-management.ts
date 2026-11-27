import type { Projeto } from '@/services/api';
import type { Candidato, StatusCandidato, StatusVaga, VagaGerenciada } from '../screens/types/management';

type CandidaturaRecebida = {
  id: string;
  agenteId: string;
  mensagem?: string | null;
  status: StatusCandidato;
  agente?: {
    id: string;
    nome?: string;
    nomeSocial?: string | null;
    avatarUrl?: string | null;
    especialidade?: string;
    notaMedia?: number;
  };
};

export type MinhaCandidatura = {
  id: string;
  status: StatusCandidato;
  projeto: Projeto;
};

export const vagaStatusLabel: Record<StatusVaga, string> = {
  ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
};

export const candidaturaStatus = {
  PENDENTE: { label: 'Aguardando resposta', tone: 'warning' },
  ACEITA: { label: 'Aceita', tone: 'success' },
  RECUSADA: { label: 'Recusada', tone: 'neutral' },
} as const;

export function mapVaga(item: Pick<Projeto, 'id' | 'titulo' | 'categoria' | 'orcamento' | 'status'> & {
  candidaturas?: CandidaturaRecebida[];
}): VagaGerenciada {
  const status = item.status === 'CONCLUIDO' ? 'CONCLUIDA'
    : item.status === 'EM_ANDAMENTO' ? 'EM_ANDAMENTO'
      : item.status === 'ABERTO' ? 'ABERTA' : 'CANCELADA';
  const candidatos: Candidato[] = (item.candidaturas ?? []).map((candidatura) => ({
    id: candidatura.id,
    agenteId: candidatura.agente?.id ?? candidatura.agenteId,
    nome: candidatura.agente?.nomeSocial || candidatura.agente?.nome || 'Agente criativo',
    avatarUrl: candidatura.agente?.avatarUrl ?? '',
    especialidade: candidatura.agente?.especialidade ?? 'Profissional criativo',
    avaliacao: Number(candidatura.agente?.notaMedia ?? 0),
    mensagem: candidatura.mensagem?.trim() ?? '',
    status: candidatura.status,
  }));
  return { id: item.id, titulo: item.titulo, categoria: item.categoria, orcamento: item.orcamento ?? undefined, status, candidatos, avaliado: false };
}

export function permiteResponder(vaga: VagaGerenciada, candidato: Candidato, status: 'ACEITA' | 'RECUSADA') {
  if (candidato.status !== 'PENDENTE') return false;
  if (status === 'RECUSADA') return vaga.status === 'ABERTA' || vaga.status === 'EM_ANDAMENTO';
  return vaga.status === 'ABERTA' && !vaga.candidatos.some((item) => item.status === 'ACEITA');
}
