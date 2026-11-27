export type Evento = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  local: string;
  cidade: string;
  latitude?: number | null;
  longitude?: number | null;
  data: string;
  horario: string;
  organizador: string;
  premium: boolean;
  destaque?: boolean;
  imagemUrl?: string;
  contratanteId?: string;
};
