import * as SecureStore from 'expo-secure-store';

// O Expo Go usa a mesma API por padrão. Um ambiente de teste pode definir a própria URL.
const configuracaoApi = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL_PADRAO = 'https://arthere-api.onrender.com';

function normalizarApiUrl(valor?: string) {
  let url = (valor || '').replace(/^['"]|['"]$/g, '').trim();

  // Corrige URLs duplicadas, como "http://http://host:3006".
  url = url.replace(/^(https?:\/\/)(https?:\/\/)+/i, '$1');

  if (!/^https?:\/\/[^\s/]+(?::\d+)?(?:\/.*)?$/i.test(url)) {
    if (valor) {
      console.warn('EXPO_PUBLIC_API_URL inválida. Usando a API padrão de produção.');
    }
    return API_URL_PADRAO;
  }

  return url.replace(/\/+$/, '');
}

export const API_URL = normalizarApiUrl(configuracaoApi);

export type AuthResponse = {
  access_token: string;
  usuario: any;
};

export type ContratanteResumo = {
  id: string;
  nome: string;
  nomeSocial?: string | null;
  empresa?: string | null;
  avatarUrl?: string | null;
  cidade?: string | null;
};

export type Projeto = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  orcamento: number | null;
  dataEvento: string | null;
  contratante: ContratanteResumo;
};

export type Sessao = {
  accessToken: string;
  usuario: any;
};

/** Erro HTTP preserva o status para que a sessão só seja encerrada quando inválida. */
export class ApiRequestError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Função principal para comunicação com o backend.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`;


  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });


    const body = await response.json().catch(() => null);


    if (!response.ok) {
      const message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : body?.message ?? 'Não foi possível concluir a operação.';

      throw new ApiRequestError(message, response.status);
    }

    return body as T;
  } catch (error) {
    throw error;
  }
}

/**
 * Requisição autenticada.
 */
async function requestAutenticado<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const sessao = await obterSessao();

  if (!sessao) {
    throw new Error('Sua sessão expirou. Entre novamente.');
  }

  return request<T>(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${sessao.accessToken}`,
    },
  });
}

const SESSION_KEY = 'arthere.session';
let sessionWrites: Promise<void> = Promise.resolve();

function escreverSessao(action: () => Promise<void>) {
  const result = sessionWrites.then(action);
  sessionWrites = result.catch(() => undefined);
  return result;
}

/** Token e perfil passam a ser gravados juntos. */
function salvarSessao(result: AuthResponse) {
  const sessao: Sessao = { accessToken: result.access_token, usuario: result.usuario };
  return escreverSessao(() => SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sessao)));
}

/**
 * Recupera a sessão salva.
 */
export class SessaoStorageError extends Error {
  constructor(cause?: unknown) {
    super('Não foi possível acessar a sessão armazenada.');
    this.name = 'SessaoStorageError';
    if (cause !== undefined) Object.defineProperty(this, 'cause', { value: cause });
  }
}

async function lerSessao(): Promise<Sessao | null> {
  const stored = await SecureStore.getItemAsync(SESSION_KEY);
  if (stored !== null) return JSON.parse(stored) as Sessao;

  // Mantém as sessões das versões que guardavam o perfil em duas chaves.
  const [accessToken, usuario] = await Promise.all([
    SecureStore.getItemAsync('access_token'),
    SecureStore.getItemAsync('usuario'),
  ]);
  return accessToken && usuario ? { accessToken, usuario: JSON.parse(usuario) } : null;
}

export async function obterSessao(): Promise<Sessao | null> {
  try {
    await sessionWrites;
    return await lerSessao();
  } catch (error) {
    throw new SessaoStorageError(error);
  }
}

export async function session() {
  const sessao = await obterSessao();

  return sessao
    ? {
        token: sessao.accessToken,
        user: sessao.usuario,
      }
    : null;
}

/**
 * Logout.
 */
export function encerrarSessao(expectedToken?: string) {
  return escreverSessao(async () => {
    if (expectedToken && (await lerSessao())?.accessToken !== expectedToken) return;
    // Limpa as chaves antigas antes da atual para evitar restaurar uma conta anterior.
    await Promise.all([
      SecureStore.deleteItemAsync('access_token'),
      SecureStore.deleteItemAsync('usuario'),
    ]);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  });
}

export async function logout() {
  return encerrarSessao();
}

/**
 * Login.
 */
export async function login(
  email: string,
  senha: string,
) {
  const result = await request<AuthResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        senha,
      }),
    },
  );

  await salvarSessao(result);

  return result;
}

/**
 * Cadastro.
 */
export async function register(
  data: Record<string, unknown>,
) {
  const result = await request<AuthResponse>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );

  await salvarSessao(result);

  return result;
}

/**
 * Usuário logado.
 */
export async function me(accessToken?: string) {
  if (accessToken) return request<AuthResponse['usuario']>('/usuarios/me', { headers: { Authorization: 'Bearer ' + accessToken } });
  return requestAutenticado<any>(
    '/usuarios/me',
  );
}

export async function obterMeuPerfil() {
  return me();
}

/**
 * Atualizar perfil.
 */
/** Envia uma imagem local para o servidor e retorna a URL persistente. */
export async function uploadImage(uri: string): Promise<string> {
  const sessao = await obterSessao();
  if (!sessao) throw new Error('Sua sessão expirou. Entre novamente.');

  const nome = uri.split('/').pop()?.split('?')[0] || 'imagem.jpg';
  const extensao = nome.split('.').pop()?.toLowerCase();
  const mime = extensao === 'png' ? 'image/png' : extensao === 'webp' ? 'image/webp' : extensao === 'gif' ? 'image/gif' : 'image/jpeg';
  // React Native 0.86 não aceita mais o objeto { uri, name, type }
  // como parte do FormData em todos os ambientes. Convertemos o arquivo
  // local para Blob, formato suportado pelo multipart nativo.
  const arquivoResponse = await fetch(uri);
  if (!arquivoResponse.ok) {
    throw new Error('Não foi possível ler a imagem selecionada.');
  }

  const blobOriginal = await arquivoResponse.blob();
  const blob = blobOriginal.type
    ? blobOriginal
    : blobOriginal.slice(0, blobOriginal.size, mime);
  if (!blob.size) {
    throw new Error('A imagem selecionada está vazia ou não pôde ser lida.');
  }

  const form = new FormData();
  form.append('file', blob, nome);

  const response = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessao.accessToken}` },
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.url) {
    throw new Error(body?.message || 'Não foi possível enviar a imagem.');
  }
  // O host utilizado pelo app é a origem confiável do upload (inclusive atrás de proxy).
  const filename = typeof body.filename === 'string' ? body.filename : '';
  if (/^[a-f0-9-]{36}\.(?:jpg|png|webp|gif)$/i.test(filename)) {
    return `${API_URL}/uploads/${filename}`;
  }
  return body.url as string;
}

export async function updateProfile(
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    '/usuarios/me',
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export async function atualizarMeuPerfil(
  data: Record<string, unknown>,
) {
  return updateProfile(data);
}

/**
 * Query string.
 */
function queryString(
  params: Record<string, unknown>,
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        query.set(key, String(value));
      }
    },
  );

  const value = query.toString();

  return value ? `?${value}` : '';
}

/**
 * Agentes.
 */
export async function agents(
  params: {
    cidade?: string;
    especialidade?: string;
    busca?: string;
  } = {},
) {
  return request<any[]>(
    `/usuarios/agentes${queryString(params)}`,
  );
}

/** Consulta o perfil público de um agente criativo. */
export async function publicAgent(id: string) {
  return request<any>(`/usuarios/agentes/${encodeURIComponent(id)}`);
}

/** Consulta o perfil público de um contratante, sem expor dados privados. */
export async function publicContractor(id: string) {
  return request<any>(`/usuarios/contratantes/${encodeURIComponent(id)}`);
}

/**
 * Projetos.
 */
export async function projects(
  params: {
    categoria?: string;
    cidade?: string;
    busca?: string;
    status?: string;
  } = {},
) {
  return request<any[]>(
    `/projetos${queryString(params)}`,
  );
}

export async function listarProjetos(
  params: {
    categoria?: string;
    cidade?: string;
    busca?: string;
    status?: string;
  } = {},
) {
  return projects(params);
}

export async function project(id: string) {
  return request<any>(
    `/projetos/${id}`,
  );
}

export async function createProject(
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    '/projetos',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export async function criarProjeto(
  data: Record<string, unknown>,
) {
  return createProject(data);
}

export async function updateProject(
  id: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    `/projetos/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export async function deleteProject(id: string) {
  return requestAutenticado<{ id: string; excluido: boolean }>(
    `/projetos/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export async function applyToProject(
  id: string,
  mensagem?: string,
) {
  return requestAutenticado<any>(
    `/projetos/${id}/candidaturas`,
    {
      method: 'POST',
      body: JSON.stringify({
        mensagem,
      }),
    },
  );
}

export async function candidatarProjeto(
  id: string,
  mensagem?: string,
) {
  return applyToProject(id, mensagem);
}

export async function meusProjetos() {
  return requestAutenticado<any[]>(
    '/projetos/minhas',
  );
}

export async function myApplications() {
  return requestAutenticado<any[]>(
    '/projetos/minhas/candidaturas',
  );
}

export async function projectApplications(
  id: string,
) {
  return requestAutenticado<any[]>(
    `/projetos/${id}/candidaturas`,
  );
}

export async function updateApplication(
  id: string,
  status: 'ACEITA' | 'RECUSADA',
) {
  return requestAutenticado<any>(
    `/projetos/candidaturas/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
      }),
    },
  );
}

/**
 * Eventos.
 */
export async function events(
  params: {
    cidade?: string;
    categoria?: string;
    busca?: string;
  } = {},
) {
  return request<any[]>(
    `/eventos${queryString(params)}`,
  );
}

export async function listarEventos(
  cidade?: string,
) {
  return events(
    cidade
      ? { cidade }
      : {},
  );
}

export async function event(id: string) {
  return request<any>(
    `/eventos/${id}`,
  );
}

export async function completedEventCovers() {
  return request<{ eventoId: string; capa: string }[]>('/eventos/fotos/concluidos');
}

export async function eventPhotos(id: string) {
  return request<string[]>(`/eventos/${encodeURIComponent(id)}/fotos`);
}

export async function saveEventPhotos(id: string, fotos: string[]) {
  return requestAutenticado<string[]>(`/eventos/${encodeURIComponent(id)}/fotos`, {
    method: 'PUT',
    body: JSON.stringify({ fotos }),
  });
}

export async function createEvent(
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    '/eventos',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export async function updateEvent(
  id: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    `/eventos/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export async function deleteEvent(
  id: string,
) {
  return requestAutenticado<any>(
    `/eventos/${id}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * Chat.
 */
export async function listarConversas() {
  return requestAutenticado<any[]>(
    '/chat/conversas',
  );
}

export async function iniciarChatComAgente(
  agenteId: string,
) {
  return requestAutenticado<any>(
    `/chat/agentes/${agenteId}/conversa`,
    {
      method: 'POST',
    },
  );
}

export async function criarConversa(
  usuarioId: string,
) {
  return requestAutenticado<any>(
    '/chat/conversas',
    {
      method: 'POST',
      body: JSON.stringify({
        usuarioId,
      }),
    },
  );
}

export async function mensagensDaConversa(
  conversaId: string,
) {
  return requestAutenticado<any[]>(
    `/chat/conversas/${conversaId}/mensagens`,
  );
}

export async function enviarMensagem(
  conversaId: string,
  texto: string,
) {
  return requestAutenticado<any>(
    `/chat/conversas/${conversaId}/mensagens`,
    {
      method: 'POST',
      body: JSON.stringify({
        texto,
      }),
    },
  );
}

/**
 * Solicitações de eventos.
 */
export async function minhasSolicitacoesEvento() {
  return requestAutenticado<any[]>(
    '/eventos/minhas/solicitacoes',
  );
}

export async function solicitarParticipacaoEvento(
  eventoId: string,
  mensagem?: string,
) {
  return requestAutenticado<any>(
    `/eventos/${eventoId}/solicitacoes`,
    {
      method: 'POST',
      body: JSON.stringify({
        mensagem,
      }),
    },
  );
}

export async function responderSolicitacaoEvento(
  id: string,
  status: 'ACEITA' | 'RECUSADA',
) {
  return requestAutenticado<any>(
    `/eventos/solicitacoes/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
      }),
    },
  );
}

/**
 * Portfólio.
 */
export async function portfolio(
  agenteId: string,
) {
  return request<any[]>(
    `/portfolio/${agenteId}`,
  );
}

export async function addPortfolio(
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    '/portfolio',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}

export async function updatePortfolio(
  id: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    `/portfolio/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
}

export async function deletePortfolio(
  id: string,
) {
  return requestAutenticado<any>(
    `/portfolio/${id}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * Avaliações.
 */
export async function ratings(
  agenteId: string,
) {
  return request<any[]>(
    `/avaliacoes/agente/${agenteId}`,
  );
}

export async function rateAgent(
  agenteId: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(
    `/avaliacoes/agente/${agenteId}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}
