export interface Avaliacao {
  id: string;
  agenteId: string;
  autorNome: string;
  nota: number; // 1 a 5
  comentario?: string;
  criadoEm: Date;
}
