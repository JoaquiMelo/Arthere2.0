import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {enviarMensagem as enviarMensagemApi,iniciarChatComAgente,listarConversas,mensagensDaConversa} from '@/services/api';
import type {AgenteCriativo} from '@/features/agents/types/agent';
import {useUser} from '@/providers/user-provider';

export type ChatMessage={id:string;text:string;sentByMe:boolean;createdAt:Date};
export type Conversation={id:string;participant:Pick<AgenteCriativo,'id'|'nome'|'avatarUrl'|'especialidades'|'disponivel'>;messages:ChatMessage[]};
type Context={conversations:Conversation[];loading:boolean;refresh:()=>Promise<void>;startConversation:(agent:AgenteCriativo)=>Promise<string>;sendMessage:(conversationId:string,text:string)=>Promise<void>;carregarMensagens:(conversationId:string)=>Promise<void>};
const Ctx=createContext<Context>({} as Context);

function participante(raw:any){
 const perfil=raw?.agente;
 const contratante=raw?.contratante;
 return {
  id:perfil?.id??raw?.id,
  nome:perfil?.nome||contratante?.nomeSocial||contratante?.nome||'Usuário Arthere',
  avatarUrl:perfil?.avatarUrl||contratante?.avatarUrl||'https://i.pravatar.cc/150?img=12',
  especialidades:perfil?.especialidade?[perfil.especialidade]:contratante?.categoria?[contratante.categoria]:['Conexão Arthere'],
  disponivel:true,
 } as Pick<AgenteCriativo,'id'|'nome'|'avatarUrl'|'especialidades'|'disponivel'>;
}
function mapConversation(raw:any,currentUserId:string):Conversation{
 const other=raw.usuarioAId===currentUserId?raw.usuarioB:raw.usuarioA;
 const mensagens=[...(raw.mensagens??[])].sort((a:any,b:any)=>new Date(a.criadoEm).getTime()-new Date(b.criadoEm).getTime());
 return {id:raw.id,participant:participante(other),messages:mensagens.map((m:any)=>({id:m.id,text:m.texto,sentByMe:m.remetenteId===currentUserId,createdAt:new Date(m.criadoEm)}))};
}

export function ChatProvider({children}:{children:React.ReactNode}){
 const{user}=useUser();
 const[conversations,setConversations]=useState<Conversation[]>([]);
 const[loading,setLoading]=useState(false);

 const refresh=useCallback(async()=>{
  if(!user?.usuarioId){setConversations([]);return;}
  setLoading(true);
  try{const lista=await listarConversas();setConversations((lista??[]).map((x:any)=>mapConversation(x,user.usuarioId)));}
  finally{setLoading(false);}
 },[user?.usuarioId]);

 useEffect(()=>{void refresh();},[refresh]);

 const startConversation=useCallback(async(agent:AgenteCriativo)=>{
  const raw=await iniciarChatComAgente(agent.id);
  if(user?.usuarioId)setConversations(c=>{const mapped=mapConversation(raw,user.usuarioId);const others=c.filter(x=>x.id!==mapped.id);return[mapped,...others];});
  return raw.id as string;
 },[user?.usuarioId]);

 const sendMessage=useCallback(async(id:string,text:string)=>{
  const value=text.trim();if(!value)return;
  if(!user?.usuarioId)throw new Error('Sessão expirada.');
  const created=await enviarMensagemApi(id,value);
  setConversations(c=>c.map(conv=>conv.id===id?{...conv,messages:[...conv.messages,{id:created.id,text:created.texto,sentByMe:true,createdAt:new Date(created.criadoEm)}]}:conv));
 },[user?.usuarioId]);

 const carregarMensagens=useCallback(async(id:string)=>{
  const lista=await mensagensDaConversa(id);
  if(!user?.usuarioId)return;
  setConversations(c=>c.map(conv=>conv.id===id?{...conv,messages:(lista??[]).map((m:any)=>({id:m.id,text:m.texto,sentByMe:m.remetenteId===user.usuarioId,createdAt:new Date(m.criadoEm)}))}:conv));
 },[user?.usuarioId]);

 const value=useMemo<Context>(()=>({conversations,loading,refresh,startConversation,sendMessage,carregarMensagens}),[conversations,loading,refresh,startConversation,sendMessage,carregarMensagens]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useChat=()=>useContext(Ctx);