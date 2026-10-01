import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AgentePerfil, MOCK_AGENT_PROFILE } from './profile-screen';
import { colors } from '@/shared/theme/colors';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const agenteAtual: AgentePerfil = route.params?.agente ?? MOCK_AGENT_PROFILE;
  const [avatarUri, setAvatarUri] = useState(agenteAtual.avatarUrl);
  const [nome, setNome] = useState(agenteAtual.nome);
  const [especialidade, setEspecialidade] = useState(agenteAtual.especialidade);
  const [cidade, setCidade] = useState(agenteAtual.cidade);
  const [bio, setBio] = useState(agenteAtual.bio);
  const [salvando, setSalvando] = useState(false);

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para trocar a foto de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!resultado.canceled && resultado.assets?.[0]) setAvatarUri(resultado.assets[0].uri);
  };

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para continuar.');
      return;
    }
    setSalvando(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      navigation.goBack();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar"><Ionicons name="chevron-back" size={25} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={escolherFoto} accessibilityLabel="Trocar foto de perfil">
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.cameraBadge}><Ionicons name="camera" size={15} color={colors.white} /></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={escolherFoto}><Text style={styles.changePhoto}>Alterar foto</Text></TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
            <Field label="Especialidade" value={especialidade} onChangeText={setEspecialidade} placeholder="Ex.: Fotógrafa e videomaker" />
            <Field label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Ex.: São Paulo, SP" icon="location-outline" />
            <View style={styles.field}>
              <Text style={styles.label}>Sobre você</Text>
              <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="Conte um pouco sobre seu trabalho" placeholderTextColor={colors.muted} multiline maxLength={280} textAlignVertical="top" />
              <Text style={styles.counter}>{bio.length}/280</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, salvando && styles.saveButtonDisabled]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.saveText}>Salvar alterações</Text><Ionicons name="checkmark" size={19} color={colors.white} /></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, ...inputProps }: { label: string; icon?: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWithIcon}>
        {icon && <Ionicons name={icon} size={18} color={colors.primaryDark} />}
        <TextInput style={styles.input} placeholderTextColor={colors.muted} editable={true} autoComplete="off" importantForAutofill="no" {...inputProps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, headerSpacer: { width: 38 },
  content: { paddingHorizontal: 20, paddingBottom: 38 }, photoSection: { alignItems: 'center', paddingVertical: 18 }, avatarWrapper: { position: 'relative' }, avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: colors.secondary }, cameraBadge: { position: 'absolute', right: 0, bottom: 1, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: colors.white }, changePhoto: { marginTop: 10, color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  form: { gap: 15 }, field: { gap: 7 }, label: { color: colors.text, fontSize: 13, fontWeight: '800' }, inputWithIcon: { minHeight: 49, borderWidth: 1, borderColor: colors.border, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8, backgroundColor: colors.white }, input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 14 }, multiline: { minHeight: 108, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 13, backgroundColor: colors.white }, counter: { alignSelf: 'flex-end', color: colors.muted, fontSize: 11 },
  saveButton: { height: 50, marginTop: 27, borderRadius: 9, backgroundColor: colors.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, saveButtonDisabled: { opacity: 0.7 }, saveText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});
