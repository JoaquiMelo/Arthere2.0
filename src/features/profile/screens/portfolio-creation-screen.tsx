import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { PortfolioItem } from './profile-screen';
import { colors } from '@/shared/theme/colors';

export default function PortfolioCreationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [itens, setItens] = useState<PortfolioItem[]>(route.params?.portfolio ?? []);
  const [novaImagemUri, setNovaImagemUri] = useState<string | null>(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const escolherImagem = async (itemId?: string) => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para selecionar uma foto.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (resultado.canceled || !resultado.assets?.[0]) return;
    if (itemId) setItens((atual) => atual.map((item) => item.id === itemId ? { ...item, imageUrl: resultado.assets[0].uri } : item));
    else setNovaImagemUri(resultado.assets[0].uri);
  };

  const adicionarItem = () => {
    if (!novaImagemUri) {
      Alert.alert('Escolha uma foto', 'Selecione uma imagem antes de adicionar o trabalho.');
      return;
    }
    setItens((atual) => [{ id: `novo-${Date.now()}`, imageUrl: novaImagemUri, titulo: novoTitulo.trim() || undefined, descricao: novaDescricao.trim() || undefined }, ...atual]);
    setNovaImagemUri(null); setNovoTitulo(''); setNovaDescricao('');
  };
  const removerItem = (id: string) => Alert.alert('Remover trabalho', 'Deseja remover este item do seu portfólio?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => setItens((atual) => atual.filter((item) => item.id !== id)) }]);
  const atualizarItem = (id: string, campo: 'titulo' | 'descricao', valor: string) => setItens((atual) => atual.map((item) => item.id === id ? { ...item, [campo]: valor } : item));
  const salvar = async () => { setSalvando(true); try { await new Promise((resolve) => setTimeout(resolve, 450)); navigation.goBack(); } finally { setSalvando(false); } };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar"><Ionicons name="chevron-back" size={25} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Editar portfólio</Text>
        <TouchableOpacity onPress={salvar} disabled={salvando} style={styles.saveHeader}>{salvando ? <ActivityIndicator size="small" color={colors.primaryDark} /> : <Text style={styles.saveHeaderText}>Salvar</Text>}</TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.intro}><Text style={styles.introTitle}>Mostre o que você cria</Text><Text style={styles.introText}>Adicione imagens e uma breve descrição dos seus melhores trabalhos.</Text></View>
          <View style={styles.addCard}>
            <Text style={styles.cardTitle}>Adicionar trabalho</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={() => escolherImagem()}>
              {novaImagemUri ? <Image source={{ uri: novaImagemUri }} style={styles.newImage} /> : <><View style={styles.addIcon}><Ionicons name="image-outline" size={24} color={colors.primaryDark} /></View><Text style={styles.imagePickerTitle}>Escolher imagem</Text><Text style={styles.imagePickerText}>JPG ou PNG</Text></>}
            </TouchableOpacity>
            <TextInput style={styles.input} value={novoTitulo} onChangeText={setNovoTitulo} placeholder="Título do trabalho" placeholderTextColor={colors.muted} />
            <TextInput style={[styles.input, styles.descriptionInput]} value={novaDescricao} onChangeText={setNovaDescricao} placeholder="Breve descrição (opcional)" placeholderTextColor={colors.muted} multiline textAlignVertical="top" />
            <TouchableOpacity style={styles.addButton} onPress={adicionarItem}><Ionicons name="add" size={19} color={colors.white} /><Text style={styles.addButtonText}>Adicionar ao portfólio</Text></TouchableOpacity>
          </View>

          <View style={styles.listHeader}><Text style={styles.listTitle}>Seus trabalhos</Text><Text style={styles.listCount}>{itens.length} itens</Text></View>
          {itens.length === 0 ? <Text style={styles.empty}>Seu portfólio ainda está vazio.</Text> : <View style={styles.items}>{itens.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TouchableOpacity style={styles.itemImageBox} onPress={() => escolherImagem(item.id)}><Image source={{ uri: item.imageUrl }} style={styles.itemImage} /><View style={styles.replaceImage}><Ionicons name="camera" size={13} color={colors.white} /></View></TouchableOpacity>
              <View style={styles.itemContent}>
                <TextInput style={styles.itemTitleInput} value={item.titulo ?? ''} onChangeText={(valor) => atualizarItem(item.id, 'titulo', valor)} placeholder="Título" placeholderTextColor={colors.muted} />
                <TextInput style={styles.itemDescriptionInput} value={item.descricao ?? ''} onChangeText={(valor) => atualizarItem(item.id, 'descricao', valor)} placeholder="Descrição" placeholderTextColor={colors.muted} multiline />
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => removerItem(item.id)} accessibilityLabel="Remover trabalho"><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>
            </View>
          ))}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, saveHeader: { width: 54, alignItems: 'flex-end' }, saveHeaderText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' }, content: { padding: 20, paddingBottom: 42 },
  intro: { marginBottom: 18 }, introTitle: { color: colors.text, fontSize: 21, fontWeight: '800' }, introText: { marginTop: 5, color: colors.muted, fontSize: 13, lineHeight: 19 }, addCard: { padding: 16, borderRadius: 14, backgroundColor: colors.surface }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 12 }, imagePicker: { height: 154, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong, marginBottom: 12 }, addIcon: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, imagePickerTitle: { marginTop: 8, color: colors.primaryDark, fontSize: 13, fontWeight: '800' }, imagePickerText: { marginTop: 2, color: colors.muted, fontSize: 11 }, newImage: { width: '100%', height: '100%' },
  input: { minHeight: 47, borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.white, color: colors.text, fontSize: 14, marginBottom: 10 }, descriptionInput: { height: 72, paddingTop: 12 }, addButton: { height: 46, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primaryDark }, addButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 }, listTitle: { color: colors.text, fontSize: 16, fontWeight: '800' }, listCount: { color: colors.muted, fontSize: 12 }, empty: { color: colors.muted, fontSize: 13 }, items: { gap: 11 }, itemCard: { minHeight: 104, flexDirection: 'row', padding: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, itemImageBox: { width: 86, height: 86, borderRadius: 8, overflow: 'hidden', position: 'relative' }, itemImage: { width: '100%', height: '100%' }, replaceImage: { position: 'absolute', right: 4, bottom: 4, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,127,144,0.9)' }, itemContent: { flex: 1, paddingLeft: 10, paddingRight: 4 }, itemTitleInput: { color: colors.text, fontSize: 14, fontWeight: '800', paddingVertical: 4 }, itemDescriptionInput: { color: colors.muted, fontSize: 12, paddingVertical: 4, minHeight: 49 }, deleteButton: { width: 27, height: 30, alignItems: 'center', justifyContent: 'center' },
});
