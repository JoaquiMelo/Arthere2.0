export type EstadoBR = { sigla: string; nome: string };

export type CidadeBR = { id: number; nome: string };

export const ESTADOS_BR: EstadoBR[] = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
];

export async function buscarCidades(uf: string): Promise<CidadeBR[]> {
  if (!uf) return [];
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
  );
  if (!response.ok) throw new Error('Não foi possível carregar as cidades.');
  return response.json();
}

export function nomeMunicipio(valor?: string | null): string {
  const nome = valor?.trim() || '';
  return /^(brasileiro|brasil|brazil|cidade não informada)$/i.test(nome) ? '' : nome;
}

export function formatarLocalizacao(cidade?: string | null, estado?: string | null): string {
  const municipio = nomeMunicipio(cidade);
  if (!municipio) return 'Localização não informada';
  const uf = ESTADOS_BR.find((item) => item.sigla === estado?.trim().toUpperCase())?.sigla;
  return uf ? `${municipio} · ${uf}` : municipio;
}

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function municipioCadastrado(cidades: CidadeBR[], nome: string): CidadeBR | undefined {
  return cidades.find((item) => normalizar(item.nome) === normalizar(nome));
}
