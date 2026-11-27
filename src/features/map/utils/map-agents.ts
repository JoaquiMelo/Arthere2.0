import type { AgenteCriativo } from '@/features/agents/types/agent';
import { CATEGORIAS } from '@/shared/config/categories';
import { formatarLocalizacao } from '@/shared/config/brazil-location';

export const MAP_CATEGORIES = {
  ...CATEGORIAS,
  outros: { label: 'Outras áreas', cor: '#6E6862', icone: 'shapes' },
} as Record<string, { label: string; cor: string; icone: string }>;

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function categoryFor(specialty: string) {
  const term = normalize(specialty);
  if (term.includes('foto')) return 'fotografo';
  if (term.includes('video') || term.includes('audiovisual')) return 'videomaker';
  if (/\bdj\b/.test(term) || term.includes('musica')) return 'dj';
  if (term.includes('artesanato')) return 'artesanato';
  if (term.includes('artesao') || term.includes('artesa')) return 'artesao';
  if (term.includes('design')) return 'design';
  return 'outros';
}

export function categoryLabel(id: string) {
  return MAP_CATEGORIES[id]?.label ?? 'Outras áreas';
}

export function mapAgent(item: any): AgenteCriativo | null {
  if (!item || typeof item.id !== 'string' || !item.id || typeof item.nome !== 'string' || !item.nome.trim() || item.visivelMapa === false) return null;
  // Number(null) e Number('') viram 0: não são coordenadas cadastradas.
  if (item.latitude == null || item.longitude == null || String(item.latitude).trim() === '' || String(item.longitude).trim() === '') return null;
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const especialidade = typeof item.especialidade === 'string' ? item.especialidade.trim() : '';
  const avaliacao = Number(item.notaMedia ?? 0);
  return {
    id: item.id,
    nome: item.nome,
    categoria: categoryFor(especialidade),
    disponivel: typeof item.disponivel === 'boolean' ? item.disponivel : undefined,
    avaliacao: Number.isFinite(avaliacao) && avaliacao >= 0 && avaliacao <= 5 ? avaliacao : 0,
    cidade: formatarLocalizacao(item.cidade, item.estado),
    especialidades: especialidade ? [especialidade] : ['Especialidade não informada'],
    latitude, longitude,
    avatarUrl: typeof item.avatarUrl === 'string' ? item.avatarUrl : '',
    bannerUrl: typeof item.bannerUrl === 'string' ? item.bannerUrl : undefined,
    descricao: typeof item.bio === 'string' ? item.bio : '',
    portfolio: Array.isArray(item.portfolio) ? item.portfolio.filter((p: any) => p && typeof p.id === 'string').map((p: any) => ({
      id: p.id, titulo: p.titulo || 'Trabalho',
      imagemUrl: [p.imageUrl, p.imagemUrl].find((value) => typeof value === 'string'),
    })) : [],
  };
}

export function matchesAgent(agente: AgenteCriativo, search: string, category: string | null) {
  if (category && agente.categoria !== category) return false;
  const term = normalize(search);
  return !term || [agente.nome, agente.cidade, categoryLabel(agente.categoria), ...agente.especialidades].some((value) => normalize(value).includes(term));
}
