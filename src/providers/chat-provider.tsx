import React,{createContext,useCallback,useContext,useMemo,useState} from 'react';
import type {AgenteCriativo} from '@/features/agents/types/agent';

export type ChatMessage={id:string;text:string;sentByMe:boolean;createdAt:Date};
export type Conversation={id:string;participant:Pick<AgenteCriativo,'id'|'nome'|'avatarUrl'|'especialidades'|'disponivel'>;messages:ChatMessage[]};

type Context={conversations:Conversation[];startConversation:(agent:AgenteCriativo)=>string;sendMessage:(conversationId:string,text:string)=>void};
const Ctx=createContext<Context>({} as Context);

export function ChatProvider({children}:{children:React.ReactNode}){
 const[conversations,setConversations]=useState<Conversation[]>([]);
 const startConversation=useCallback((agent:AgenteCriativo)=>{
  const existing=conversations.find(c=>c.participant.id===agent.id);
  if(existing)return existing.id;
  const id='chat-'+agent.id;
  setConversations(current=>[{id,participant:{id:agent.id,nome:agent.nome,avatarUrl:agent.avatarUrl,especialidades:agent.especialidades,disponivel:agent.disponivel},messages:[]},...current]);
  return id;
 },[conversations]);
 const sendMessage=useCallback((conversationId:string,text:string)=>{
  const message=text.trim(); if(!message)return;
  setConversations(current=>current.map(c=>c.id===conversationId?{...c,messages:[...c.messages,{id:String(Date.now()),text:message,sentByMe:true,createdAt:new Date()}]}:c));
 },[]);
 const value=useMemo(()=>({conversations,startConversation,sendMessage}),[conversations,startConversation,sendMessage]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useChat=()=>useContext(Ctx);