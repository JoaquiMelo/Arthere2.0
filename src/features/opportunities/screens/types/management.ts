export type StatusCandidato = 'PENDENTE' | 'ACEITA' | 'RECUSADA';
export type StatusVaga = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export interface Candidato {
  id: string;
  agenteId: string;
  nome: string;
  avatarUrl: string;
  especialidade: string;
  avaliacao: number;
  mensagem: string;
  status: StatusCandidato;
}

export interface VagaGerenciada {
  id: string;
  titulo: string;
  categoria: string;
  orcamento?: number;
  status: StatusVaga;
  candidatos: Candidato[];
  avaliado: boolean;
}
