export type Evento = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  local: string;
  cidade: string;
  data: string;
  horario: string;
  organizador: string;
  premium: boolean;
  destaque?: boolean;
  imagemUrl?: string;
};

export const MOCK_EVENTOS: Evento[] = [
  {
    id: 'evt-1',
    titulo: 'Festival Criativo da Baixada',
    categoria: 'Cultura',
    descricao: 'Feira com artistas, designers, música e gastronomia local.',
    local: 'Centro Cultural',
    cidade: 'Santos - SP',
    data: '2026-09-26',
    horario: '10:00',
    organizador: 'Arthere Cultural',
    premium: true,
    destaque: true,
  },
  {
    id: 'evt-2',
    titulo: 'Mostra de Arte Independente',
    categoria: 'Artes Visuais',
    descricao: 'Exposição aberta para artistas independentes da região.',
    local: 'Galeria Municipal',
    cidade: 'Praia Grande - SP',
    data: '2026-09-27',
    horario: '14:00',
    organizador: 'Coletivo Horizonte',
    premium: true,
    destaque: true,
  },
  {
    id: 'evt-3',
    titulo: 'Workshop de Fotografia',
    categoria: 'Fotografia',
    descricao: 'Oficina prática para fotógrafos iniciantes e profissionais.',
    local: 'Espaço Criativo',
    cidade: 'São Vicente - SP',
    data: '2026-10-03',
    horario: '09:00',
    organizador: 'FotoLab',
    premium: false,
    destaque: false,
  },
  {
    id: 'evt-4',
    titulo: 'Sarau da Baixada',
    categoria: 'Literatura',
    descricao: 'Poesia, música e performances autorais.',
    local: 'Casa da Cultura',
    cidade: 'Mongaguá - SP',
    data: '2026-10-05',
    horario: '18:30',
    organizador: 'Sarau Livre',
    premium: false,
    destaque: false,
  },
];
