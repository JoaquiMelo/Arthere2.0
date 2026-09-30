import React,{createContext,useContext,useEffect,useState} from 'react'; import * as api from '../services/api';
type Ctx={user:any;loading:boolean;login:(e:string,s:string)=>Promise<void>;register:(d:any)=>Promise<void>;logout:()=>Promise<void>;refresh:()=>Promise<void>};
const UserContext=createContext<Ctx>({} as Ctx);
export function UserProvider({children}:{children:React.ReactNode}){const[user,setUser]=useState<any>(null);const[loading,setLoading]=useState(true);
const refresh=async()=>{try{const s=await api.session();if(s){const r=await api.me();setUser({id:r.id,email:r.email,tipo:r.tipo,perfil:r.perfil})}else setUser(null)}catch{setUser(null)}};
useEffect(()=>{refresh().finally(()=>setLoading(false))},[]);
const value={user,loading,login:async(e:string,s:string)=>{const r=await api.login(e,s);setUser(r.usuario)},register:async(d:any)=>{const r=await api.register(d);setUser(r.usuario)},logout:async()=>{await api.logout();setUser(null)},refresh};return <UserContext.Provider value={value}>{children}</UserContext.Provider>}
export const useUser=()=>useContext(UserContext);