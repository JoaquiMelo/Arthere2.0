import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type Auth = { access_token:string; usuario:any };

async function req<T>(path:string,options:RequestInit={}):Promise<T>{
 const r=await fetch(API_URL+path,{...options,headers:{'Content-Type':'application/json',...(options.headers??{})}});
 const b=await r.json().catch(()=>null);
 if(!r.ok)throw new Error(Array.isArray(b?.message)?b.message.join(', '):b?.message??'Não foi possível concluir a operação.');
 return b;
}
async function authReq<T>(path:string,options:RequestInit={}){
 const token=await SecureStore.getItemAsync('access_token');
 if(!token)throw new Error('Sessão expirada.');
 return req<T>(path,{...options,headers:{...(options.headers??{}),Authorization:'Bearer '+token}});
}
async function saveAuth(a:Auth){await SecureStore.setItemAsync('access_token',a.access_token);await SecureStore.setItemAsync('usuario',JSON.stringify(a.usuario));}

export async function login(email:string,senha:string){const a=await req<Auth>('/auth/login',{method:'POST',body:JSON.stringify({email,senha})});await saveAuth(a);return a;}
export async function register(data:any){const a=await req<Auth>('/auth/register',{method:'POST',body:JSON.stringify(data)});await saveAuth(a);return a;}
export async function session(){const [token,user]=await Promise.all([SecureStore.getItemAsync('access_token'),SecureStore.getItemAsync('usuario')]);return token&&user?{token,user:JSON.parse(user)}:null;}
export async function logout(){await SecureStore.deleteItemAsync('access_token');await SecureStore.deleteItemAsync('usuario');}
export async function me(){return authReq<any>('/usuarios/me');}
export async function updateProfile(data:any){return authReq<any>('/usuarios/me',{method:'PATCH',body:JSON.stringify(data)});}
export async function agents(params:any={}){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v)q.set(k,String(v));});return req<any[]>('/usuarios/agentes'+(q.toString()?'?'+q.toString():''));}

export async function projects(params:any={}){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v)q.set(k,String(v));});return req<any[]>('/projetos'+(q.toString()?'?'+q.toString():''));}
export async function project(id:string){return req<any>('/projetos/'+id);}
export async function createProject(data:any){return authReq<any>('/projetos',{method:'POST',body:JSON.stringify(data)});}
export async function updateProject(id:string,data:any){return authReq<any>('/projetos/'+id,{method:'PATCH',body:JSON.stringify(data)});}
export async function applyToProject(id:string,mensagem?:string){return authReq<any>('/projetos/'+id+'/candidaturas',{method:'POST',body:JSON.stringify({mensagem})});}
export async function myApplications(){return authReq<any[]>('/projetos/minhas/candidaturas');}
export async function projectApplications(id:string){return authReq<any[]>('/projetos/'+id+'/candidaturas');}
export async function updateApplication(id:string,status:'ACEITA'|'RECUSADA'){return authReq<any>('/projetos/candidaturas/'+id,{method:'PATCH',body:JSON.stringify({status})});}

export async function events(params:any={}){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v)q.set(k,String(v));});return req<any[]>('/eventos'+(q.toString()?'?'+q.toString():''));}
export async function event(id:string){return req<any>('/eventos/'+id);}
export async function createEvent(data:any){return authReq<any>('/eventos',{method:'POST',body:JSON.stringify(data)});}
export async function updateEvent(id:string,data:any){return authReq<any>('/eventos/'+id,{method:'PATCH',body:JSON.stringify(data)});}
export async function deleteEvent(id:string){return authReq<any>('/eventos/'+id,{method:'DELETE'});}

export async function portfolio(agenteId:string){return req<any[]>('/portfolio/'+agenteId);}
export async function addPortfolio(data:any){return authReq<any>('/portfolio',{method:'POST',body:JSON.stringify(data)});}
export async function updatePortfolio(id:string,data:any){return authReq<any>('/portfolio/'+id,{method:'PATCH',body:JSON.stringify(data)});}
export async function deletePortfolio(id:string){return authReq<any>('/portfolio/'+id,{method:'DELETE'});}

export async function ratings(agenteId:string){return req<any[]>('/avaliacoes/agente/'+agenteId);}
export async function rateAgent(agenteId:string,data:any){return authReq<any>('/avaliacoes/agente/'+agenteId,{method:'POST',body:JSON.stringify(data)});}
