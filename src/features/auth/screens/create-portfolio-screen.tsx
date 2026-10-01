import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React,{useState} from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@/providers/user-provider';
import { addPortfolio } from '@/services/api';
import { colors } from '@/shared/theme/colors';

export default function CreatePortfolioScreen(){
 const navigation=useNavigation<any>(); const {user,updateProfile}=useUser();
 const [especialidade,setEspecialidade]=useState(user?.especialidade||'');
 const [cidade,setCidade]=useState(user?.cidade||'');
 const [bio,setBio]=useState(user?.bio||'');
 const [imagemUrl,setImagemUrl]=useState('');
 const [preview,setPreview]=useState<string|null>(null);
 const [titulo,setTitulo]=useState('');
 const [carregando,setCarregando]=useState(false);

 const selecionarImagem=async()=>{
  const permissao=await ImagePicker.requestMediaLibraryPermissionsAsync();
  if(!permissao.granted){Alert.alert('Permissão necessária','Autorize o acesso à galeria para selecionar uma imagem.');return;}
  const resultado=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.8});
  if(!resultado.canceled&&resultado.assets?.[0]) setPreview(resultado.assets[0].uri);
 };

 const handleSalvarPerfil=async()=>{
  if(!especialidade.trim()||!cidade.trim()){Alert.alert('Atenção','Preencha a especialidade e a cidade.');return;}
  try{
   setCarregando(true);
   await updateProfile({especialidade:especialidade.trim(),cidade:cidade.trim(),bio:bio.trim()});
   const url=imagemUrl.trim();
   if(url){
    if(!/^https?:\/\//i.test(url)){Alert.alert('URL inválida','Para salvar a amostra, use uma URL pública começando com http:// ou https://.');return;}
    await addPortfolio({agenteId:user?.id,imageUrl:url,titulo:titulo.trim()||undefined});
   }
   navigation.reset({index:0,routes:[{name:'Tabs'}]});
  }catch(error){Alert.alert('Não foi possível concluir',error instanceof Error?error.message:'Falha ao salvar os dados.');}
  finally{setCarregando(false);}
 };

 return <SafeAreaView style={styles.container}>
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
   <View style={styles.hero}><Text style={styles.kicker}>AGENTE CRIATIVO</Text><Text style={styles.title}>Configure seu portfólio</Text><Text style={styles.subtitle}>Mostre seu trabalho e deixe seu perfil pronto para os contratantes.</Text></View>
   <Text style={styles.label}>ÁREA DE ATUAÇÃO</Text>
   <View style={styles.inputContainer}><Ionicons name="brush-outline" size={20} color={colors.muted}/><TextInput style={styles.input} placeholder="Ex.: Fotógrafo, Designer, DJ" placeholderTextColor={colors.muted} value={especialidade} onChangeText={setEspecialidade}/></View>
   <Text style={styles.label}>CIDADE</Text>
   <View style={styles.inputContainer}><Ionicons name="location-outline" size={20} color={colors.muted}/><TextInput style={styles.input} placeholder="Cidade - UF" placeholderTextColor={colors.muted} value={cidade} onChangeText={setCidade}/></View>
   <Text style={styles.label}>SOBRE VOCÊ</Text>
   <View style={[styles.inputContainer,styles.textAreaContainer]}><TextInput style={[styles.input,styles.textArea]} placeholder="Fale sobre seu trabalho e experiência" placeholderTextColor={colors.muted} value={bio} onChangeText={setBio} multiline/></View>
   <Text style={styles.sectionTitle}>PRIMEIRA AMOSTRA (OPCIONAL)</Text>
   <TouchableOpacity style={styles.imageBox} onPress={selecionarImagem}>
    {preview?<Image source={{uri:preview}} style={styles.preview}/>:<><View style={styles.addIcon}><Ionicons name="image-outline" size={28} color={colors.brandInk}/></View><Text style={styles.imageTitle}>Selecionar imagem</Text><Text style={styles.imageHint}>Use uma URL pública para salvar no banco</Text></>}
   </TouchableOpacity>
   <TextInput style={styles.fullInput} placeholder="URL pública da imagem (https://...)" placeholderTextColor={colors.muted} value={imagemUrl} onChangeText={setImagemUrl} autoCapitalize="none" autoCorrect={false}/>
   <TextInput style={styles.fullInput} placeholder="Título da amostra (opcional)" placeholderTextColor={colors.muted} value={titulo} onChangeText={setTitulo}/>
   <TouchableOpacity style={styles.button} onPress={handleSalvarPerfil} disabled={carregando}>{carregando?<ActivityIndicator color={colors.white}/>:<><Text style={styles.buttonText}>CONCLUIR E IR PARA O MAPA</Text><Ionicons name="arrow-forward" size={20} color={colors.white}/></>}</TouchableOpacity>
  </ScrollView>
 </SafeAreaView>;
}

const styles=StyleSheet.create({
 container:{flex:1,backgroundColor:colors.brandPaper},
 scrollContent:{padding:22,paddingBottom:42},
 hero:{backgroundColor:colors.brandInk,padding:20,borderRadius:20,marginBottom:20},
 kicker:{color:colors.brandSand,fontSize:9,fontWeight:'900',letterSpacing:1.6},
 title:{color:colors.brandPaper,fontSize:29,fontWeight:'900',marginTop:7,lineHeight:33},
 subtitle:{color:colors.brandPaper,fontSize:12,lineHeight:18,opacity:.88,marginTop:8},
 label:{color:colors.muted,fontSize:9,fontWeight:'900',letterSpacing:1.2,marginTop:5,marginBottom:7},
 inputContainer:{flexDirection:'row',alignItems:'center',backgroundColor:colors.white,borderRadius:12,paddingHorizontal:14,minHeight:52,marginBottom:12,borderWidth:1,borderColor:colors.border,gap:9},
 input:{flex:1,fontSize:15,color:colors.text,paddingVertical:10},
 textAreaContainer:{minHeight:108,alignItems:'flex-start',paddingTop:12},
 textArea:{minHeight:84,textAlignVertical:'top'},
 sectionTitle:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:colors.brandCoral,marginTop:7,marginBottom:10},
 imageBox:{height:170,borderRadius:16,borderWidth:1.5,borderStyle:'dashed',borderColor:colors.brandCoral,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',overflow:'hidden'},
 preview:{width:'100%',height:'100%'},
 addIcon:{width:52,height:52,borderRadius:26,backgroundColor:colors.brandPaper,alignItems:'center',justifyContent:'center'},
 imageTitle:{color:colors.brandInk,fontSize:14,fontWeight:'900',marginTop:9},
 imageHint:{color:colors.muted,fontSize:10,marginTop:3},
 fullInput:{minHeight:50,borderWidth:1,borderColor:colors.border,borderRadius:12,backgroundColor:colors.white,color:colors.text,paddingHorizontal:13,marginTop:10},
 button:{minHeight:54,backgroundColor:colors.brandInk,borderRadius:999,paddingHorizontal:17,marginTop:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 buttonText:{color:colors.white,fontSize:10,fontWeight:'900',letterSpacing:1}
});