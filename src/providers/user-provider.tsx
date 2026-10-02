import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as api from '../services/api';

export type TipoUsuario = 'AGENTE' | 'CONTRATANTE' | 'ADMIN';

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

  const refresh = async () => {
    try {
      const sessao = await api.obterSessao();

      if (!sessao) {
        setUser(null);
        return;
      }

      const remoto = await api.me();
      setUser(mapUsuario(remoto));
    } catch {
      await api.encerrarSessao();
      setUser(null);
    }
  };

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, []);

  const value: UserContextType = {
    user,
    loading,
    login: async (email, senha) => {
      const result = await api.login(email.trim(), senha);
      setUser(mapUsuario(result.usuario));
    },
    register: async (dados) => {
      const result = await api.register(dados);
      setUser(mapUsuario(result.usuario));
    },
    updateProfile: async (dados) => {
      const payload = { ...dados } as Record<string, unknown>;
      delete payload.id;
      delete payload.usuarioId;
      delete payload.tipo;
      delete payload.documento;
      if (dados.documento !== undefined) payload.cpfCnpj = dados.documento;

      const result = await api.updateProfile(payload);
      setUser((current) =>
        current ? { ...current, ...mapUsuario({
          id: current.usuarioId,
          email: current.email,
          tipo: current.tipo,
          perfil: result.perfil,
        }) } : current,
      );
    },
    logout: async () => {
      await api.logout();
      setUser(null);
    },
    refresh,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
