import React,{useState} from 'react';
import {Alert,Button,SafeAreaView,ScrollView,Text,TextInput} from 'react-native';
import {useUser} from '../providers/user-provider';

export default function Register({navigation}:any){
 const{register}=useUser();
 const[nome,setNome]=useState('');const[nomeSocial,setNomeSocial]=useState('');const[pronomes,setPronomes]=useState('');
 const[email,setEmail]=useState('');const[senha,setSenha]=useState('');const[cidade,setCidade]=useState('');
 const[tipo,setTipo]=useState<'AGENTE'|'CONTRATANTE'>('AGENTE');const[cpfCnpj,setCpfCnpj]=useState('');
 const[especialidade,setEspecialidade]=useState('');const[empresa,setEmpresa]=useState('');const[categoria,setCategoria]=useState('');
 const[busy,setBusy]=useState(false);
 const go=async()=>{if(!nome.trim()||!email.trim()||senha.length<8){Alert.alert('Dados inválidos','Informe nome, e-mail e uma senha com pelo menos 8 caracteres.');return;}
  try{setBusy(true);await register({nome,nomeSocial,pronomes,cpfCnpj,email,senha,cidade,tipo,especialidade,empresa,categoria});}
  catch(e:any){Alert.alert('Erro',e.message)}finally{setBusy(false)}
 };
 return <SafeAreaView style={{flex:1}}><ScrollView contentContainerStyle={{padding:24,gap:12}}>
  <Text style={{fontSize:30,fontWeight:'800'}}>Criar conta</Text>
  <TextInput placeholder="Nome completo" value={nome} onChangeText={setNome} style={{borderWidth:1,padding:14,borderRadius:12}}/>
  <TextInput placeholder="Nome social (opcional)" value={nomeSocial} onChangeText={setNomeSocial} style={{borderWidth:1,padding:14,borderRadius:12}}/>
  <TextInput placeholder="Pronomes (opcional)" value={pronomes} onChangeText={setPronomes} style={{borderWidth:1,padding:14,borderRadius:12}}/>
  <TextInput placeholder="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{borderWidth:1,padding:14,borderRadius:12}}/>
  <TextInput placeholder="Senha (mín. 8 caracteres)" secureTextEntry value={senha} onChangeText={setSenha} style={{borderWidth:1,padding:14,borderRadius:12}}/>
  <TextInput placeholder="Cidade" value={cidade} onChangeText={setCidade} style={{borderWidth:1,padding:14,borderRadius:12}}/>
  <Button title={tipo==='AGENTE'?'Tipo: Agente criativo':'Tipo: Contratante'} onPress={()=>setTipo(tipo==='AGENTE'?'CONTRATANTE':'AGENTE')}/>
  {tipo==='AGENTE'?<TextInput placeholder="Área de atuação" value={especialidade} onChangeText={setEspecialidade} style={{borderWidth:1,padding:14,borderRadius:12}}/>:
   <><TextInput placeholder="CPF ou CNPJ" value={cpfCnpj} onChangeText={setCpfCnpj} style={{borderWidth:1,padding:14,borderRadius:12}}/>
   <TextInput placeholder="Empresa (opcional)" value={empresa} onChangeText={setEmpresa} style={{borderWidth:1,padding:14,borderRadius:12}}/>
   <TextInput placeholder="Categoria" value={categoria} onChangeText={setCategoria} style={{borderWidth:1,padding:14,borderRadius:12}}/></>}
  <Button title={busy?'Criando...':'Criar conta'} onPress={go} disabled={busy}/><Button title="Voltar" onPress={()=>navigation.goBack()}/>
 </ScrollView></SafeAreaView>
}