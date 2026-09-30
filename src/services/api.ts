import * as SecureStore from 'expo-secure-store';
export const API_URL=process.env.EXPO_PUBLIC_API_URL??'http://localhost:3000';
type Auth={access_token:string;usuario:any};
async function req<T>(path:string,options:RequestInit={}):Promise<T>{const r=await fetch(API_URL+path,{...options,headers:{'Content-Type':'application/json',...(options.headers??{})}});const b=await r.json().catch(()=>null);if(!r.ok)throw new Error(Array.isArray(b?.message)?b.message.join(', '):b?.message??'Não foi possível concluir a operação.');return b}
export async function login(email:string,senha:string){const a=await req<Auth>('/auth/login',{method:'POST',body:JSON.stringify({email,senha})});await SecureStore.setItemAsync('access_token',a.access_token);await SecureStore.setItemAsync('usuario',JSON.stringify(a.usuario));return a}
export async function register(data:any){const a=await req<Auth>('/auth/register',{method:'POST',body:JSON.stringify(data)});await SecureStore.setItemAsync('access_token',a.access_token);await SecureStore.setItemAsync('usuario',JSON.stringify(a.usuario));return a}
export async function session(){const [token,user]=await Promise.all([SecureStore.getItemAsync('access_token'),SecureStore.getItemAsync('usuario')]);return token&&user?{token,user:JSON.parse(user)}:null}
export async function logout(){await SecureStore.deleteItemAsync('access_token');await SecureStore.deleteItemAsync('usuario')}
export async function me(){const s=await session();if(!s)throw new Error('Sessão expirada.');return req<any>('/usuarios/me',{headers:{Authorization:'Bearer '+s.token}})}
export async function projects(){return req<any[]>('/projetos')}
export async function events(cidade?:string){return req<any[]>('/eventos'+(cidade?'?cidade='+encodeURIComponent(cidade):''))}
