import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type AuthResponse = { access_token: string; usuario: any };
export type Sessao = { accessToken: string; usuario: any };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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
    throw new Error(message);
  }

  return body as T;
}

async function requestAutenticado<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const sessao = await obterSessao();
  if (!sessao) throw new Error('Sua sessão expirou. Entre novamente.');

  return request<T>(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${sessao.accessToken}`,
    },
  });
}

async function salvarSessao(result: AuthResponse) {
  await SecureStore.setItemAsync('access_token', result.access_token);
  await SecureStore.setItemAsync('usuario', JSON.stringify(result.usuario));
}

export async function obterSessao(): Promise<Sessao | null> {
  try {
    const [accessToken, usuario] = await Promise.all([
      SecureStore.getItemAsync('access_token'),
      SecureStore.getItemAsync('usuario'),
    ]);

    if (!accessToken || !usuario) return null;

    return { accessToken, usuario: JSON.parse(usuario) };
  } catch {
    return null;
  }
}

export async function session() {
  const sessao = await obterSessao();
  return sessao
    ? { token: sessao.accessToken, user: sessao.usuario }
    : null;
}

export async function encerrarSessao() {
  await Promise.all([
    SecureStore.deleteItemAsync('access_token'),
    SecureStore.deleteItemAsync('usuario'),
  ]);
}

export async function logout() {
  return encerrarSessao();
}

export async function login(email: string, senha: string) {
  const result = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  await salvarSessao(result);
  return result;
}

export async function register(data: Record<string, unknown>) {
  const result = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await salvarSessao(result);
  return result;
}

export async function me() {
  return requestAutenticado<any>('/usuarios/me');
}

export async function obterMeuPerfil() {
  return me();
}

export async function updateProfile(data: Record<string, unknown>) {
  return requestAutenticado<any>('/usuarios/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function atualizarMeuPerfil(data: Record<string, unknown>) {
  return updateProfile(data);
}

function queryString(params: Record<string, unknown>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : '';
}

export async function agents(params: {
  cidade?: string;
  especialidade?: string;
  busca?: string;
} = {}) {
  return request<any[]>(`/usuarios/agentes${queryString(params)}`);
}

export async function projects(params: {
  categoria?: string;
  cidade?: string;
  busca?: string;
  status?: string;
} = {}) {
  return request<any[]>(`/projetos${queryString(params)}`);
}

export async function listarProjetos(params: {
  categoria?: string;
  cidade?: string;
  busca?: string;
  status?: string;
} = {}) {
  return projects(params);
}

export async function project(id: string) {
  return request<any>(`/projetos/${id}`);
}

export async function createProject(data: Record<string, unknown>) {
  return requestAutenticado<any>('/projetos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function criarProjeto(data: Record<string, unknown>) {
  return createProject(data);
}

export async function updateProject(
  id: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(`/projetos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function applyToProject(id: string, mensagem?: string) {
  return requestAutenticado<any>(`/projetos/${id}/candidaturas`, {
    method: 'POST',
    body: JSON.stringify({ mensagem }),
  });
}

export async function candidatarProjeto(id: string, mensagem?: string) {
  return applyToProject(id, mensagem);
}

export async function meusProjetos() {
  return requestAutenticado<any[]>('/projetos/minhas');
}

export async function myApplications() {
  return requestAutenticado<any[]>('/projetos/minhas/candidaturas');
}

export async function projectApplications(id: string) {
  return requestAutenticado<any[]>(`/projetos/${id}/candidaturas`);
}

export async function updateApplication(
  id: string,
  status: 'ACEITA' | 'RECUSADA',
) {
  return requestAutenticado<any>(`/projetos/candidaturas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function events(params: {
  cidade?: string;
  categoria?: string;
  busca?: string;
} = {}) {
  return request<any[]>(`/eventos${queryString(params)}`);
}

export async function listarEventos(cidade?: string) {
  return events(cidade ? { cidade } : {});
}

export async function event(id: string) {
  return request<any>(`/eventos/${id}`);
}

export async function createEvent(data: Record<string, unknown>) {
  return requestAutenticado<any>('/eventos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(
  id: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(`/eventos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id: string) {
  return requestAutenticado<any>(`/eventos/${id}`, {
    method: 'DELETE',
  });
}

export async function portfolio(agenteId: string) {
  return request<any[]>(`/portfolio/${agenteId}`);
}

export async function addPortfolio(data: Record<string, unknown>) {
  return requestAutenticado<any>('/portfolio', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePortfolio(
  id: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(`/portfolio/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePortfolio(id: string) {
  return requestAutenticado<any>(`/portfolio/${id}`, {
    method: 'DELETE',
  });
}

export async function ratings(agenteId: string) {
  return request<any[]>(`/avaliacoes/agente/${agenteId}`);
}

export async function rateAgent(
  agenteId: string,
  data: Record<string, unknown>,
) {
  return requestAutenticado<any>(`/avaliacoes/agente/${agenteId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
