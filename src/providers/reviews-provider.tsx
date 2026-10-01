import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { rateAgent, ratings } from '@/services/api';
import { useUser } from '@/providers/user-provider';
import type { Avaliacao } from '@/features/reviews/types/review';

type NovaAvaliacao = { agenteId:string; autorNome?:string; nota:number; comentario?:string };
type Context = { avaliacoesPorAgente:(id:string)=>Avaliacao[]; mediaPorAgente:(id:string)=>number; adicionarAvaliacao:(d:NovaAvaliacao)=>Promise<void>; carregarAvaliacoes:(id:string)=>Promise<void> };
const Ctx=createContext<Context>({} as Context);

function mapAvaliacao(x:any):Avaliacao { return { id:x.id, agenteId:x.agenteId, autorNome:x.contratante?.nomeSocial||x.contratante?.nome||'Contratante', nota:Number(x.nota), comentario:x.comentario??undefined, criadoEm:new Date(x.criadoEm) }; }

export function ReviewsProvider({children}:{children:React.ReactNode}) {
 const {user}=useUser(); const [dados,setDados]=useState<Record<string,Avaliacao[]>>({});
 const carregarAvaliacoes=useCallback(async(id:string)=>{const lista=await ratings(id);setDados(c=>({...c,[id]:(lista??[]).map(mapAvaliacao)}));},[]);
 useEffect(()=>{if(user?.tipo==='AGENTE'&&user.id){void carregarAvaliacoes(user.id);}},[user?.id,user?.tipo,carregarAvaliacoes]);
 const avaliacoesPorAgente=useCallback((id:string)=>dados[id]??[],[dados]);
 const mediaPorAgente=useCallback((id:string)=>{const lista=dados[id]??[];return lista.length?lista.reduce((s,a)=>s+a.nota,0)/lista.length:0;},[dados]);
 const adicionarAvaliacao=useCallback(async(d:NovaAvaliacao)=>{if(!Number.isInteger(d.nota)||d.nota<1||d.nota>5)throw new Error('A nota deve estar entre 1 e 5.');await rateAgent(d.agenteId,{nota:d.nota,comentario:d.comentario?.trim()||undefined});await carregarAvaliacoes(d.agenteId);},[carregarAvaliacoes]);
 const value=useMemo(()=>({avaliacoesPorAgente,mediaPorAgente,adicionarAvaliacao,carregarAvaliacoes}),[avaliacoesPorAgente,mediaPorAgente,adicionarAvaliacao,carregarAvaliacoes]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useReviews=()=>useContext(Ctx);