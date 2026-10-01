import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createEvent, createProject, events as listarEventosApi, meusProjetos, projects, updateApplication, updateProject } from '@/services/api';
import type { Candidato, StatusVaga, VagaGerenciada } from '@/features/opportunities/screens/types/management';
import type { Evento } from '@/features/events/types/event';
import { useUser } from '@/providers/user-provider';
export type SolicitacaoEvento = { id:string; eventId:string; eventoTitulo:string; agenteId:string; agenteNome:string; agenteEspecialidade:string; mensagem:string; status:'PENDENTE'|'ACEITA'|'RECUSADA' };
type NovoEvento = Omit<Evento,'id'>;
type NovaVaga = { titulo:string; descricao?:string; categoria:string; orcamento?:number };
type Context = { vagas:VagaGerenciada[]; eventos:Evento[]; solicitacoesEvento:SolicitacaoEvento[]; loading:boolean; refresh:()=>Promise<void>; publicarVaga:(d:NovaVaga)=>Promise<void>; criarEvento:(d:NovoEvento)=>Promise<void>; aceitarCandidato:(vagaId:string,candidatoId:string)=>Promise<void>; recusarCandidato:(vagaId:string,candidatoId:string)=>Promise<void>; concluirVaga:(vagaId:string)=>Promise<void>; marcarAvaliado:(vagaId:string)=>void; enviarSolicitacaoEvento:(d:Omit<SolicitacaoEvento,'id'|'status'>)=>void; aceitarSolicitacaoEvento:(id:string)=>void; recusarSolicitacaoEvento:(id:string)=>void };
const Ctx=createContext<Context>({} as Context);
function statusVaga(s:string):StatusVaga { return s==='EM_ANDAMENTO'?'EM_ANDAMENTO':s==='CONCLUIDO'?'CONCLUIDA':'ABERTA'; }
function mapCandidato(x:any):Candidato { return { id:x.id, agenteId:x.agente?.id??x.agenteId, nome:x.agente?.nome??'Agente criativo', avatarUrl:x.agente?.avatarUrl??'https://i.pravatar.cc/150?img=12', especialidade:x.agente?.especialidade??'Profissional criativo', avaliacao:Number(x.agente?.notaMedia??0), mensagem:x.mensagem??'Sem mensagem.', status:x.status }; }
function mapVaga(x:any):VagaGerenciada { return { id:x.id, titulo:x.titulo, categoria:x.categoria, orcamento:x.orcamento??undefined, status:statusVaga(x.status), avaliado:false, candidatos:(x.candidaturas??[]).map(mapCandidato) }; }
function mapEvento(x:any):Evento { const d=new Date(x.dataEvento); const data=Number.isNaN(d.getTime())?String(x.dataEvento).slice(0,10):[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); return { id:x.id,titulo:x.titulo,categoria:x.categoria,descricao:x.descricao,local:x.local,cidade:x.cidade,data,horario:x.horario??'',organizador:x.organizador??'',premium:Boolean(x.premium),destaque:Boolean(x.fixado) }; }
export function ManagementProvider({children}:{children:React.ReactNode}) {
 const {user}=useUser(); const [vagas,setVagas]=useState<VagaGerenciada[]>([]); const [eventos,setEventos]=useState<Evento[]>([]); const [solicitacoesEvento,setSolicitacoesEvento]=useState<SolicitacaoEvento[]>([]); const [loading,setLoading]=useState(false); const [avaliados,setAvaliados]=useState<Set<string>>(new Set());
 const refresh=useCallback(async()=>{ if(!user){setVagas([]);setEventos([]);return;} setLoading(true); try{ const [ev,pr]=await Promise.all([listarEventosApi(),user.tipo==='CONTRATANTE'?meusProjetos():projects()]); setEventos((ev??[]).map(mapEvento)); setVagas((pr??[]).map(mapVaga)); } finally {setLoading(false);} },[user?.id,user?.tipo]);
 useEffect(()=>{void refresh();},[refresh]);
 const publicarVaga=useCallback(async(d:NovaVaga)=>{await createProject({titulo:d.titulo,descricao:d.descricao??'Oportunidade publicada pela Arthere.',categoria:d.categoria,orcamento:d.orcamento});await refresh();},[refresh]);
 const criarEvento=useCallback(async(d:NovoEvento)=>{const dataEvento=new Date(d.data+'T'+(d.horario||'00:00')+':00');await createEvent({titulo:d.titulo,descricao:d.descricao,categoria:d.categoria,local:d.local,cidade:d.cidade,dataEvento:dataEvento.toISOString(),horario:d.horario,organizador:d.organizador,premium:d.premium,fixado:d.destaque});await refresh();},[refresh]);
 const responder=useCallback(async(id:string,status:'ACEITA'|'RECUSADA')=>{await updateApplication(id,status);await refresh();},[refresh]);
 const aceitarCandidato=useCallback((_:string,id:string)=>responder(id,'ACEITA'),[responder]); const recusarCandidato=useCallback((_:string,id:string)=>responder(id,'RECUSADA'),[responder]);
 const concluirVaga=useCallback(async(id:string)=>{await updateProject(id,{status:'CONCLUIDO'});await refresh();},[refresh]);
 const marcarAvaliado=useCallback((id:string)=>setAvaliados(s=>new Set(s).add(id)),[]);
 const enviarSolicitacaoEvento=useCallback((d:Omit<SolicitacaoEvento,'id'|'status'>)=>setSolicitacoesEvento(c=>c.some(x=>x.eventId===d.eventId&&x.agenteId===d.agenteId&&x.status==='PENDENTE')?c:[{...d,id:'local-event-request-'+Date.now(),status:'PENDENTE'},...c]),[]);
 const alterarSolicitacao=(id:string,status:SolicitacaoEvento['status'])=>setSolicitacoesEvento(c=>c.map(x=>x.id===id?{...x,status}:x));
 const value=useMemo(()=>({vagas:vagas.map(v=>({...v,avaliado:avaliados.has(v.id)||v.avaliado})),eventos,solicitacoesEvento,loading,refresh,publicarVaga,criarEvento,aceitarCandidato,recusarCandidato,concluirVaga,marcarAvaliado,enviarSolicitacaoEvento,aceitarSolicitacaoEvento:(id:string)=>alterarSolicitacao(id,'ACEITA'),recusarSolicitacaoEvento:(id:string)=>alterarSolicitacao(id,'RECUSADA')}),[vagas,eventos,solicitacoesEvento,loading,refresh,publicarVaga,criarEvento,aceitarCandidato,recusarCandidato,concluirVaga,marcarAvaliado,enviarSolicitacaoEvento,avaliados]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useManagement=()=>useContext(Ctx);