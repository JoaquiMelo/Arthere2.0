import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {uploadImage,createEvent,createProject,events as listarEventosApi,meusProjetos,minhasSolicitacoesEvento,projects,responderSolicitacaoEvento,solicitarParticipacaoEvento,updateApplication,updateProject} from '@/services/api';
import type {VagaGerenciada} from '@/features/opportunities/screens/types/management';
import {mapVaga} from '@/features/opportunities/utils/opportunity-management';
import type {Evento} from '@/features/events/types/event';
import {mapEvento} from '@/features/events/utils/event-agenda';
import {useUser} from '@/providers/user-provider';

export type SolicitacaoEvento={id:string;eventId:string;eventoTitulo:string;agenteId:string;agenteNome:string;agenteEspecialidade:string;mensagem:string;status:'PENDENTE'|'ACEITA'|'RECUSADA'};
type NovoEvento=Omit<Evento,'id'>;
type NovaVaga={titulo:string;descricao?:string;categoria:string;orcamento?:number};
type Context={vagas:VagaGerenciada[];eventos:Evento[];solicitacoesEvento:SolicitacaoEvento[];loading:boolean;refresh:()=>Promise<void>;publicarVaga:(d:NovaVaga)=>Promise<void>;criarEvento:(d:NovoEvento)=>Promise<void>;aceitarCandidato:(vagaId:string,candidatoId:string)=>Promise<void>;recusarCandidato:(vagaId:string,candidatoId:string)=>Promise<void>;concluirVaga:(vagaId:string)=>Promise<void>;marcarAvaliado:(vagaId:string)=>void;enviarSolicitacaoEvento:(d:Omit<SolicitacaoEvento,'id'|'status'>)=>Promise<void>;aceitarSolicitacaoEvento:(id:string)=>Promise<void>;recusarSolicitacaoEvento:(id:string)=>Promise<void>};
const Ctx=createContext<Context>({} as Context);

function mapSolicitacao(x:any):SolicitacaoEvento{return{id:x.id,eventId:x.eventoId,eventoTitulo:x.evento?.titulo??'Evento',agenteId:x.agente?.id??x.agenteId,agenteNome:x.agente?.nome??'Agente criativo',agenteEspecialidade:x.agente?.especialidade??'Profissional criativo',mensagem:x.mensagem??'',status:x.status};}

export function ManagementProvider({children}:{children:React.ReactNode}){
 const{user}=useUser();const usuarioId=user?.usuarioId;const tipo=user?.tipo;const[vagas,setVagas]=useState<VagaGerenciada[]>([]);const[eventos,setEventos]=useState<Evento[]>([]);const[solicitacoesEvento,setSolicitacoesEvento]=useState<SolicitacaoEvento[]>([]);const[loading,setLoading]=useState(false);const[avaliados,setAvaliados]=useState<Set<string>>(new Set());
 const requestVersion=useRef(0);
 const refresh=useCallback(async()=>{
  const version=++requestVersion.current;
  if(!usuarioId){setVagas([]);setEventos([]);setSolicitacoesEvento([]);setLoading(false);return;}
  setLoading(true);
  try{
   const[ev,pr,sr]=await Promise.all([listarEventosApi(),tipo==='CONTRATANTE_OPORTUNIDADES'?meusProjetos():projects(),tipo==='AGENTE'||tipo==='CONTRATANTE_EVENTOS'?minhasSolicitacoesEvento():Promise.resolve([])]);
   if(version!==requestVersion.current)return;
   setEventos((ev??[]).map(mapEvento));setVagas((pr??[]).map(mapVaga));setSolicitacoesEvento((sr??[]).map(mapSolicitacao));
  }finally{if(version===requestVersion.current)setLoading(false);}
 },[usuarioId,tipo]);
 useEffect(()=>{const task=setTimeout(()=>{void refresh().catch(()=>undefined);},0);return()=>clearTimeout(task);},[refresh]);
 const publicarVaga=useCallback(async(d:NovaVaga)=>{await createProject({titulo:d.titulo,descricao:d.descricao??'Oportunidade publicada pela Arthere.',categoria:d.categoria,orcamento:d.orcamento});await refresh();},[refresh]);
 const criarEvento=useCallback(async(d:NovoEvento)=>{const dataEvento=new Date(d.data+'T'+(d.horario||'00:00')+':00');const imagemUrl=d.imagemUrl?.startsWith('file:')||d.imagemUrl?.startsWith('content:')?await uploadImage(d.imagemUrl):d.imagemUrl;await createEvent({titulo:d.titulo,descricao:d.descricao,categoria:d.categoria,local:d.local,cidade:d.cidade,dataEvento:dataEvento.toISOString(),horario:d.horario,organizador:d.organizador,premium:d.premium,fixado:d.destaque,imagemUrl});await refresh();},[refresh]);
 const responder=useCallback(async(id:string,status:'ACEITA'|'RECUSADA')=>{await updateApplication(id,status);await refresh();},[refresh]);
 const aceitarCandidato=useCallback((_:string,id:string)=>responder(id,'ACEITA'),[responder]);
 const recusarCandidato=useCallback((_:string,id:string)=>responder(id,'RECUSADA'),[responder]);
 const concluirVaga=useCallback(async(id:string)=>{await updateProject(id,{status:'CONCLUIDO'});await refresh();},[refresh]);
 const marcarAvaliado=useCallback((id:string)=>setAvaliados(s=>new Set(s).add(id)),[]);
 const enviarSolicitacaoEvento=useCallback(async(d:Omit<SolicitacaoEvento,'id'|'status'>)=>{await solicitarParticipacaoEvento(d.eventId,d.mensagem);await refresh();},[refresh]);
 const aceitarSolicitacaoEvento=useCallback(async(id:string)=>{await responderSolicitacaoEvento(id,'ACEITA');await refresh();},[refresh]);
 const recusarSolicitacaoEvento=useCallback(async(id:string)=>{await responderSolicitacaoEvento(id,'RECUSADA');await refresh();},[refresh]);
 const value=useMemo(()=>({vagas:vagas.map(v=>({...v,avaliado:avaliados.has(v.id)||v.avaliado})),eventos,solicitacoesEvento,loading,refresh,publicarVaga,criarEvento,aceitarCandidato,recusarCandidato,concluirVaga,marcarAvaliado,enviarSolicitacaoEvento,aceitarSolicitacaoEvento,recusarSolicitacaoEvento}),[vagas,eventos,solicitacoesEvento,loading,refresh,publicarVaga,criarEvento,aceitarCandidato,recusarCandidato,concluirVaga,marcarAvaliado,enviarSolicitacaoEvento,aceitarSolicitacaoEvento,recusarSolicitacaoEvento,avaliados]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useManagement=()=>useContext(Ctx);
