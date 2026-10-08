import React,{useCallback,useState} from 'react';
import {ActivityIndicator,Alert,Image,KeyboardAvoidingView,Platform,SafeAreaView,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {useFocusEffect,useNavigation} from '@react-navigation/native';
import {useUser} from '@/providers/user-provider';
import {addPortfolio,deletePortfolio,portfolio as fetchPortfolio,updatePortfolio} from '@/services/api';
import {colors} from '@/shared/theme/colors';

type Item={id:string;imageUrl:string;titulo?:string;descricao?:string};
const FALLBACK='https://picsum.photos/seed/arthere-default/500/500';

export default function PortfolioCreationScreen(){
 const navigation=useNavigation<any>(); const {user}=useUser();
 const [itens,setItens]=useState<Item[]>([]); const [novaUrl,setNovaUrl]=useState(''); const [novoTitulo,setNovoTitulo]=useState(''); const [novaDescricao,setNovaDescricao]=useState('');
 const [preview,setPreview]=useState<string|null>(null); const [carregando,setCarregando]=useState(true); const [salvando,setSalvando]=useState(false);

 const carregarPortfolio=useCallback(async()=>{
  if(!user?.id){setCarregando(false);return;}
  setCarregando(true);
  try{
   const lista=await fetchPortfolio(user.id);
   setItens((lista??[]).map((x:any)=>({id:x.id,imageUrl:x.imageUrl,titulo:x.titulo,descricao:x.descricao})));
  }catch(e){
   Alert.alert('Portfólio',e instanceof Error?e.message:'Não foi possível carregar o portfólio.');
  }finally{
   setCarregando(false);
  }
 },[user?.id]);

 useFocusEffect(
  useCallback(()=>{void carregarPortfolio();},[carregarPortfolio]),
 );

 const escolherImagem=async()=>{const p=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!p.granted){Alert.alert('Permissão necessária','Autorize o acesso à galeria para selecionar uma imagem.');return;}const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:.8});if(!r.canceled&&r.assets?.[0]){setPreview(r.assets[0].uri);Alert.alert('Imagem selecionada','Para que a imagem fique acessível em outros dispositivos, informe também uma URL pública.');}};
 const adicionar=async()=>{const image=(novaUrl.trim()||preview||'').trim();if(!image){Alert.alert('Escolha uma imagem','Informe uma URL pública ou selecione uma imagem.');return;}if(!/^https?:\/\//i.test(image)){Alert.alert('URL necessária','A imagem selecionada no aparelho é apenas uma pré-visualização. Para persistir no banco, informe uma URL pública começando com http:// ou https://.');return;}if(!user?.id)return;setSalvando(true);try{const criado=await addPortfolio({agenteId:user.id,imageUrl:image,titulo:novoTitulo.trim()||undefined,descricao:novaDescricao.trim()||undefined});setItens(current=>[{id:criado.id,imageUrl:criado.imageUrl,titulo:criado.titulo,descricao:criado.descricao},...current]);setNovaUrl('');setNovoTitulo('');setNovaDescricao('');setPreview(null);}catch(e){Alert.alert('Não foi possível adicionar',e instanceof Error?e.message:'Tente novamente.');}finally{setSalvando(false);}};
 const atualizar=async(item:Item)=>{setSalvando(true);try{await updatePortfolio(item.id,{imageUrl:item.imageUrl,titulo:item.titulo||undefined,descricao:item.descricao||undefined});}catch(e){Alert.alert('Não foi possível salvar',e instanceof Error?e.message:'Tente novamente.');}finally{setSalvando(false);}};
 const remover=(id:string)=>Alert.alert('Remover trabalho','Deseja remover este item?', [{text:'Cancelar',style:'cancel'},{text:'Remover',style:'destructive',onPress:async()=>{try{await deletePortfolio(id);setItens(current=>current.filter(x=>x.id!==id));}catch(e){Alert.alert('Erro',e instanceof Error?e.message:'Não foi possível remover.');}}}]);

 return <SafeAreaView style={styles.container}>
  <View style={styles.header}><TouchableOpacity style={styles.back} onPress={()=>navigation.goBack()}><Ionicons name="chevron-back" size={24} color={colors.brandInk}/></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.kicker}>PORTFÓLIO</Text><Text style={styles.title}>Seus trabalhos</Text></View><View style={styles.count}><Text style={styles.countText}>{itens.length}</Text></View></View>
  <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
   <View style={styles.intro}><Text style={styles.introTitle}>Mostre o que você cria</Text><Text style={styles.introText}>Os trabalhos ficam vinculados ao seu perfil e são lidos diretamente do banco.</Text></View>
   <View style={styles.addCard}><Text style={styles.cardKicker}>NOVO TRABALHO</Text><Text style={styles.cardTitle}>Adicionar ao portfólio</Text>
    <TouchableOpacity style={styles.imagePicker} onPress={escolherImagem}>{preview?<Image source={{uri:preview}} style={styles.newImage}/>:<><View style={styles.addIcon}><Ionicons name="image-outline" size={25} color={colors.primaryDark}/></View><Text style={styles.imageTitle}>Selecionar imagem</Text><Text style={styles.imageHint}>A seleção local é usada como prévia</Text></>}</TouchableOpacity>
    <TextInput style={styles.input} value={novaUrl} onChangeText={setNovaUrl} placeholder="URL pública da imagem (https://...)" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false}/>
    <TextInput style={styles.input} value={novoTitulo} onChangeText={setNovoTitulo} placeholder="Título do trabalho" placeholderTextColor={colors.muted}/>
    <TextInput style={[styles.input,styles.multiline]} value={novaDescricao} onChangeText={setNovaDescricao} placeholder="Descrição opcional" placeholderTextColor={colors.muted} multiline textAlignVertical="top"/>
    <TouchableOpacity style={[styles.primaryButton,salvando&&styles.disabled]} onPress={adicionar} disabled={salvando}>{salvando?<ActivityIndicator color={colors.brandPaper}/>:<><Ionicons name="add" size={18} color={colors.brandPaper}/><Text style={styles.primaryText}>ADICIONAR TRABALHO</Text></>}</TouchableOpacity>
   </View>
   <View style={styles.listHeader}><Text style={styles.sectionKicker}>PUBLICADOS</Text><Text style={styles.sectionTitle}>Seu portfólio</Text></View>
   {carregando?<ActivityIndicator color={colors.brandCoral} style={{marginTop:25}}/>:itens.length===0?<View style={styles.empty}><Ionicons name="images-outline" size={31} color={colors.brandCoral}/><Text style={styles.emptyTitle}>Nenhum trabalho ainda</Text><Text style={styles.emptyText}>Adicione uma imagem pública para começar a montar seu portfólio.</Text></View>:itens.map(item=><View key={item.id} style={styles.itemCard}><Image source={{uri:item.imageUrl||FALLBACK}} style={styles.itemImage}/><View style={styles.itemBody}><TextInput style={styles.itemTitle} value={item.titulo||''} onChangeText={v=>setItens(c=>c.map(x=>x.id===item.id?{...x,titulo:v}:x))} placeholder="Título" placeholderTextColor={colors.muted}/><TextInput style={styles.itemDescription} value={item.descricao||''} onChangeText={v=>setItens(c=>c.map(x=>x.id===item.id?{...x,descricao:v}:x))} placeholder="Descrição" placeholderTextColor={colors.muted} multiline/><View style={styles.itemActions}><TouchableOpacity onPress={()=>atualizar(item)}><Text style={styles.saveText}>SALVAR</Text></TouchableOpacity><TouchableOpacity onPress={()=>remover(item.id)}><Text style={styles.deleteText}>REMOVER</Text></TouchableOpacity></View></View></View>)}
  </ScrollView></KeyboardAvoidingView>
 </SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:colors.brandPaper},flex:{flex:1},header:{minHeight:72,paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:colors.border,gap:10},back:{width:40,height:40,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,borderRadius:12},headerCopy:{flex:1},kicker:{fontSize:8,fontWeight:'900',letterSpacing:1.5,color:colors.brandCoral},title:{fontSize:23,fontWeight:'900',color:colors.brandInk,marginTop:2},count:{width:36,height:36,alignItems:'center',justifyContent:'center',backgroundColor:colors.brandInk,borderRadius:18},countText:{fontSize:12,fontWeight:'900',color:colors.brandPaper},content:{padding:18,paddingBottom:42},intro:{marginBottom:16},introTitle:{fontSize:22,fontWeight:'900',color:colors.brandInk},introText:{fontSize:12,lineHeight:18,color:colors.muted,marginTop:4},addCard:{backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:18,padding:15},cardKicker:{fontSize:8,fontWeight:'900',letterSpacing:1.3,color:colors.brandCoral},cardTitle:{fontSize:17,fontWeight:'900',color:colors.brandInk,marginTop:3,marginBottom:12},imagePicker:{height:160,borderWidth:1.5,borderStyle:'dashed',borderColor:colors.brandCoral,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',borderRadius:14,overflow:'hidden'},newImage:{width:'100%',height:'100%'},addIcon:{width:48,height:48,borderRadius:24,backgroundColor:colors.brandPaper,alignItems:'center',justifyContent:'center'},imageTitle:{marginTop:8,fontSize:13,fontWeight:'900',color:colors.brandInk},imageHint:{fontSize:10,color:colors.muted,marginTop:3},input:{minHeight:47,borderWidth:1,borderColor:colors.border,borderRadius:10,backgroundColor:colors.brandPaper,paddingHorizontal:12,color:colors.brandInk,fontSize:13,marginTop:10},multiline:{height:82,paddingTop:11},primaryButton:{minHeight:46,backgroundColor:colors.brandInk,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,marginTop:12},primaryText:{fontSize:9,fontWeight:'900',letterSpacing:1,color:colors.brandPaper},disabled:{opacity:.6},listHeader:{marginTop:25,marginBottom:10},sectionKicker:{fontSize:8,fontWeight:'900',letterSpacing:1.3,color:colors.brandCoral},sectionTitle:{fontSize:19,fontWeight:'900',color:colors.brandInk,marginTop:2},empty:{padding:25,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,borderRadius:16,alignItems:'center'},emptyTitle:{fontSize:15,fontWeight:'900',color:colors.brandInk,marginTop:9},emptyText:{fontSize:11.5,lineHeight:17,color:colors.muted,textAlign:'center',marginTop:5},itemCard:{flexDirection:'row',padding:10,borderWidth:1,borderColor:colors.border,backgroundColor:colors.white,borderRadius:15,marginBottom:10,gap:10},itemImage:{width:88,height:88,borderRadius:10,backgroundColor:colors.surface},itemBody:{flex:1,minWidth:0},itemTitle:{fontSize:14,fontWeight:'900',color:colors.brandInk,paddingVertical:4},itemDescription:{fontSize:11.5,lineHeight:16,color:colors.muted,minHeight:42,paddingVertical:3},itemActions:{flexDirection:'row',gap:16,marginTop:5},saveText:{fontSize:8,fontWeight:'900',letterSpacing:1,color:colors.brandCoral},deleteText:{fontSize:8,fontWeight:'900',letterSpacing:1,color:colors.danger}});
