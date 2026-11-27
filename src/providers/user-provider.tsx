import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as api from '../services/api';

export type TipoUsuario = 'AGENTE' | 'CONTRATANTE_EVENTOS' | 'CONTRATANTE_OPORTUNIDADES' | 'ADMIN';

export interface LocalUser {
  id: string;
  usuarioId: string;
  documento?: string;
  nome: string;
  nomeSocial?: string;
  pronomes?: string;
  email: string;
  tipo: TipoUsuario;
  especialidade?: string;
  estado?: string;
  cidade?: string;
  latitude?: number | null;
  longitude?: number | null;
  bio?: string | null;
  telefone?: string | null;
  foto?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  empresa?: string | null;
  descricao?: string | null;
  site?: string | null;
  endereco?: string | null;
  categoria?: string | null;
  visivelMapa?: boolean;
  notaMedia?: number;
  totalAvaliacoes?: number;
  totalProjetos?: number;
  portfolio?: any[];
}

type UserContextType = {
  user: LocalUser | null;
  loading: boolean;
  needsOnboarding: boolean;
  finishOnboarding: () => void;
  login: (email: string, senha: string) => Promise<void>;
  register: (dados: Record<string, unknown>) => Promise<void>;
  updateProfile: (dados: Partial<LocalUser>) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({} as UserContextType);

function mapUsuario(usuario: any): LocalUser {
  const perfil = usuario?.perfil ?? {};

  return {
    id: perfil.id ?? usuario.id,
    usuarioId: usuario.id,
    nome: perfil.nome ?? '',
    nomeSocial: perfil.nomeSocial ?? undefined,
    pronomes: perfil.pronomes ?? undefined,
    email: usuario.email,
    tipo: usuario.tipo,
    documento: perfil.cpfCnpj ?? undefined,
    especialidade: perfil.especialidade ?? undefined,
    estado: perfil.estado ?? undefined,
    cidade: perfil.cidade ?? undefined,
    latitude: perfil.latitude ?? null,
    longitude: perfil.longitude ?? null,
    bio: perfil.bio ?? perfil.descricao ?? null,
    telefone: perfil.telefone ?? null,
    foto: perfil.avatarUrl ?? null,
    avatarUrl: perfil.avatarUrl ?? null,
    bannerUrl: perfil.bannerUrl ?? null,
    empresa: perfil.empresa ?? null,
    descricao: perfil.descricao ?? perfil.bio ?? null,
    site: perfil.site ?? null,
    endereco: perfil.endereco ?? null,
    categoria: perfil.categoria ?? null,
    visivelMapa: perfil.visivelMapa ?? false,
    notaMedia: perfil.notaMedia ?? 0,
    totalAvaliacoes: perfil.totalAvaliacoes ?? 0,
    totalProjetos: perfil.totalProjetos ?? 0,
    portfolio: perfil.portfolio ?? [],
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingFor, setOnboardingFor] = useState<string | null>(null);

  // A mesma sessão pode receber vários pedidos de atualização simultâneos.
  // Uma resposta iniciada antes de editar o perfil ou trocar de conta é descartada.
  const revision = useRef(0);
  const activeRefresh = useRef<{ revision: number; promise: Promise<void> } | null>(null);

  const refresh = useCallback((): Promise<void> => {
    const started = revision.current;
    if (activeRefresh.current?.revision === started) return activeRefresh.current.promise;

    const promise = (async () => {
      try {
        const sessao = await api.obterSessao();
        if (revision.current !== started) return;
        if (!sessao) {
          setUser(null);
          return;
        }

        try {
          const remoto = await api.me(sessao.accessToken);
          if (revision.current === started) setUser(mapUsuario(remoto));
        } catch (error) {
          if (revision.current !== started) return;
          if (error instanceof api.ApiRequestError && error.status === 401) {
            await api.encerrarSessao(sessao.accessToken);
            if (revision.current === started) setUser(null);
          } else {
            // Cache local só é usado se ainda não existe um perfil em memória.
            // Nunca restaura fotos, município ou demais campos anteriores ao PATCH.
            setUser((current) => current ?? mapUsuario(sessao.usuario));
          }
        }
      } catch {
        // Falha de armazenamento/rede não equivale a logout.
      }
    })();
    activeRefresh.current = { revision: started, promise };
    void promise.finally(() => {
      if (activeRefresh.current?.promise === promise) activeRefresh.current = null;
    });
    return promise;
  }, []);

  useEffect(() => {
    const task = setTimeout(() => {
      void refresh().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(task);
  }, [refresh]);

  const value: UserContextType = {
    user,
    loading,
    needsOnboarding: Boolean(user && user.usuarioId === onboardingFor),
    finishOnboarding: () => setOnboardingFor(null),
    login: async (email, senha) => {
      const started = ++revision.current;
      const result = await api.login(email.trim(), senha);
      if (revision.current === started) {
        setOnboardingFor(null);
        setUser(mapUsuario(result.usuario));
      }
    },
    register: async (dados) => {
      const started = ++revision.current;
      const result = await api.register(dados);
      if (revision.current === started) {
        const registered = mapUsuario(result.usuario);
        setOnboardingFor(registered.usuarioId);
        setUser(registered);
      }
    },
    updateProfile: async (dados) => {
      const payload = { ...dados } as Record<string, unknown>;
      delete payload.id;
      delete payload.usuarioId;
      delete payload.tipo;
      delete payload.documento;
      if (dados.documento !== undefined) payload.cpfCnpj = dados.documento;

      const started = revision.current;
      const result = await api.updateProfile(payload);
      if (revision.current !== started) return;
      revision.current += 1;
      setUser((current) => {
        if (!current) return current;
        const atualizado = mapUsuario({
          id: current.usuarioId,
          email: current.email,
          tipo: current.tipo,
          perfil: result.perfil,
        });
        // O PATCH do agente não inclui a relação de portfólio.
        return { ...current, ...atualizado, portfolio: result.perfil?.portfolio ?? current.portfolio };
      });
    },
    logout: async () => {
      const started = ++revision.current;
      await api.logout();
      if (revision.current === started) {
        setOnboardingFor(null);
        setUser(null);
      }
    },
    refresh,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
