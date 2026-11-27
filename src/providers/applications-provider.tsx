import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import type { StatusCandidato } from '@/features/opportunities/screens/types/management';
import type { MinhaCandidatura } from '@/features/opportunities/utils/opportunity-management';
import { useUser } from '@/providers/user-provider';
import { ApiRequestError, candidatarProjeto, myApplications } from '@/services/api';

function useApplicationState() {
  const { user } = useUser();
  const isAgent = user?.tipo === 'AGENTE';
  const [items, setItems] = useState<MinhaCandidatura[] | null>(null);
  const [loading, setLoading] = useState(isAgent);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState<ReadonlySet<string>>(() => new Set());
  const [registered, setRegistered] = useState<ReadonlySet<string>>(() => new Set());
  const request = useRef<symbol | null>(null);
  const lastLoaded = useRef<MinhaCandidatura[] | null>(null);
  const pending = useRef(new Set<string>());
  const confirmed = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!isAgent || request.current) return;
    const id = Symbol();
    request.current = id;
    setLoading(true);
    setFailed(false);
    try {
      const list: MinhaCandidatura[] = await myApplications();
      if (!Array.isArray(list) || list.some((item) => !item.projeto?.id)) throw new Error('Resposta inválida');
      if (request.current === id) {
        lastLoaded.current = list;
        setItems(list);
      }
    } catch {
      if (request.current === id) setFailed(true);
    } finally {
      if (request.current === id) {
        request.current = null;
        setLoading(false);
      }
    }
  }, [isAgent]);

  const statusByProject = useMemo(() => new Map<string, StatusCandidato>(
    (items ?? []).map((item) => [item.projeto.id, item.status]),
  ), [items]);

  const submit = async (projectId: string) => {
    if (!isAgent || !lastLoaded.current || failed || request.current || pending.current.has(projectId)
      || confirmed.current.has(projectId) || lastLoaded.current.some((item) => item.projeto.id === projectId)) return;

    pending.current.add(projectId);
    setSending(new Set(pending.current));
    try {
      await candidatarProjeto(projectId);
      confirmed.current.add(projectId);
    } catch (error) {
      if (!(error instanceof ApiRequestError && error.status === 409)) throw error;
      confirmed.current.add(projectId);
    } finally {
      pending.current.delete(projectId);
      setSending(new Set(pending.current));
    }
    setRegistered(new Set(confirmed.current));
    // Uma consulta iniciada antes da confirmação pode não incluir o envio.
    request.current = null;
    void load();
  };

  return { items, loading, failed, load, submit, sending, registered, statusByProject };
}

const ApplicationsContext = createContext<ReturnType<typeof useApplicationState> | null>(null);

/** Montado dentro da árvore de sessão, isolada por identidade. */
export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const state = useApplicationState();
  return <ApplicationsContext.Provider value={state}>{children}</ApplicationsContext.Provider>;
}

export function useApplications() {
  const state = useContext(ApplicationsContext);
  if (!state) throw new Error('ApplicationsProvider indisponível');
  return state;
}
