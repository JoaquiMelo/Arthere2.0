import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {createProject,events as listarEventosApi,meusProjetos,minhasSolicitacoesEvento,projects,responderSolicitacaoEvento,solicitarParticipacaoEvento,updateApplication,updateProject} from '@/services/api';
import type {VagaGerenciada} from '@/features/opportunities/screens/types/management';
import {mapVaga} from '@/features/opportunities/utils/opportunity-management';
import type {Evento} from '@/features/events/types/event';
import {mapEvento} from '@/features/events/utils/event-agenda';
import {useUser} from '@/providers/user-provider';

export type SolicitacaoEvento={id:string;eventId:string;eventoTitulo:string;agenteId:string;agenteNome:string;agenteEspecialidade:string;mensagem:string;status:'PENDENTE'|'ACEITA'|'RECUSADA'};
type NovaVaga={titulo:string;descricao?:string;categoria:string;orcamento?:number};
type Context={vagas:VagaGerenciada[];eventos:Evento[];solicitacoesEvento:SolicitacaoEvento[];loading:boolean;refresh:()=>Promise<void>;publicarVaga:(d:NovaVaga)=>Promise<void>;refreshSolicitacoes:()=>Promise<void>;aceitarCandidato:(vagaId:string,candidatoId:string)=>Promise<void>;recusarCandidato:(vagaId:string,candidatoId:string)=>Promise<void>;concluirVaga:(vagaId:string)=>Promise<void>;marcarAvaliado:(vagaId:string)=>void;enviarSolicitacaoEvento:(d:Omit<SolicitacaoEvento,'id'|'status'>)=>Promise<void>;aceitarSolicitacaoEvento:(id:string)=>Promise<void>;recusarSolicitacaoEvento:(id:string)=>Promise<void>};
const Ctx=createContext<Context>({} as Context);

function mapSolicitacao(x:any):SolicitacaoEvento{return{id:x.id,eventId:x.eventoId,eventoTitulo:x.evento?.titulo??'Evento',agenteId:x.agente?.id??x.agenteId,agenteNome:x.agente?.nome??'Agente criativo',agenteEspecialidade:x.agente?.especialidade??'Profissional criativo',mensagem:x.mensagem??'',status:x.status};}

export function ManagementProvider({children}:{children:React.ReactNode}){
 const{user}=useUser();const usuarioId=user?.usuarioId;const tipo=user?.tipo;const[vagas,setVagas]=useState<VagaGerenciada[]>([]);const[eventos,setEventos]=useState<Evento[]>([]);const[solicitacoesEvento,setSolicitacoesEvento]=useState<SolicitacaoEvento[]>([]);const[loading,setLoading]=useState(false);const[avaliados,setAvaliados]=useState<Set<string>>(new Set());
 const requestVersion=useRef(0);
 const solicitationVersion = useRef(0);
 const activeSolicitations = useRef<{ version: number; promise: Promise<void> } | null>(null);
 const refreshSolicitacoes = useCallback(async () => {
  if (tipo !== 'AGENTE' && tipo !== 'CONTRATANTE_EVENTOS') return;
  if (activeSolicitations.current?.version === solicitationVersion.current) return activeSolicitations.current.promise;
  const version = ++solicitationVersion.current;
  const promise = (async () => {
   const items = await minhasSolicitacoesEvento();
   if (!Array.isArray(items)) throw new Error('Não foi possível consultar as participações.');
   if (version === solicitationVersion.current) setSolicitacoesEvento(items.map(mapSolicitacao));
  })();
  activeSolicitations.current = { version, promise };
  try {
   await promise;
  } finally {
   if (activeSolicitations.current?.version === version) activeSolicitations.current = null;
  }
 }, [tipo]);
 const refresh=useCallback(async()=>{
  const version=++requestVersion.current;
  if(!usuarioId){setVagas([]);setEventos([]);setSolicitacoesEvento([]);setLoading(false);return;}
  setLoading(true);
  try{
   const [eventsResult, projectsResult, requestsResult] = await Promise.allSettled([
    listarEventosApi(), tipo === 'CONTRATANTE_OPORTUNIDADES' ? meusProjetos() : projects(), refreshSolicitacoes(),
   ]);
   if (version !== requestVersion.current) return;
   if (eventsResult.status === 'fulfilled') setEventos((eventsResult.value ?? []).map(mapEvento));
   if (projectsResult.status === 'fulfilled') setVagas((projectsResult.value ?? []).map(mapVaga));
   const failure = [eventsResult, projectsResult, requestsResult].find((result) => result.status === 'rejected');
   if (failure?.status === 'rejected') throw failure.reason;
  }finally{if(version===requestVersion.current)setLoading(false);}
 },[usuarioId,tipo,refreshSolicitacoes]);
 useEffect(()=>{const task=setTimeout(()=>{void refresh().catch(()=>undefined);},0);return()=>clearTimeout(task);},[refresh]);
 const publicarVaga=useCallback(async(d:NovaVaga)=>{await createProject({titulo:d.titulo,descricao:d.descricao??'Oportunidade publicada pela Arthere.',categoria:d.categoria,orcamento:d.orcamento});await refresh();},[refresh]);
 const responder=useCallback(async(id:string,status:'ACEITA'|'RECUSADA')=>{await updateApplication(id,status);await refresh();},[refresh]);
 const aceitarCandidato=useCallback((_:string,id:string)=>responder(id,'ACEITA'),[responder]);
 const recusarCandidato=useCallback((_:string,id:string)=>responder(id,'RECUSADA'),[responder]);
 const concluirVaga=useCallback(async(id:string)=>{await updateProject(id,{status:'CONCLUIDO'});await refresh();},[refresh]);
 const marcarAvaliado=useCallback((id:string)=>setAvaliados(s=>new Set(s).add(id)),[]);
 const updateSolicitacao = useCallback((item: SolicitacaoEvento) => {
  // Uma leitura iniciada antes da mutação não pode desfazer a confirmação.
  solicitationVersion.current += 1;
  setSolicitacoesEvento((current) => [item, ...current.filter((request) => request.id !== item.id)]);
 }, []);
 const enviarSolicitacaoEvento = useCallback(async (data: Omit<SolicitacaoEvento, 'id' | 'status'>) => {
  const result = await solicitarParticipacaoEvento(data.eventId, data.mensagem);
  updateSolicitacao(mapSolicitacao(result));
 }, [updateSolicitacao]);
 const responderEvento = useCallback(async (id: string, status: 'ACEITA' | 'RECUSADA') => {
  const result = await responderSolicitacaoEvento(id, status);
  updateSolicitacao(mapSolicitacao(result));
 }, [updateSolicitacao]);
 const aceitarSolicitacaoEvento = useCallback((id: string) => responderEvento(id, 'ACEITA'), [responderEvento]);
 const recusarSolicitacaoEvento = useCallback((id: string) => responderEvento(id, 'RECUSADA'), [responderEvento]);
 const value=useMemo(()=>({vagas:vagas.map(v=>({...v,avaliado:avaliados.has(v.id)||v.avaliado})),eventos,solicitacoesEvento,loading,refresh,publicarVaga,refreshSolicitacoes,aceitarCandidato,recusarCandidato,concluirVaga,marcarAvaliado,enviarSolicitacaoEvento,aceitarSolicitacaoEvento,recusarSolicitacaoEvento}),[vagas,eventos,solicitacoesEvento,loading,refresh,publicarVaga,refreshSolicitacoes,aceitarCandidato,recusarCandidato,concluirVaga,marcarAvaliado,enviarSolicitacaoEvento,aceitarSolicitacaoEvento,recusarSolicitacaoEvento,avaliados]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useManagement=()=>useContext(Ctx);
