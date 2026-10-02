import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '@/providers/user-provider';
import { ARTHERE_LOGO } from '@/shared/assets/artHere-logo';
import { buscarCidades, CidadeBR, ESTADOS_BR } from '@/shared/config/brazil-location';

type TipoUsuario = 'AGENTE' | 'CONTRATANTE';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useUser();
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('AGENTE');
  const [nome, setNome] = useState('');
  const [nomeSocial, setNomeSocial] = useState('');
  const [pronomes, setPronomes] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [bio, setBio] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [categoria, setCategoria] = useState('');
  const [telefone, setTelefone] = useState('');
  const [site, setSite] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [cidades, setCidades] = useState<CidadeBR[]>([]);
  const [modalLocal, setModalLocal] = useState<'estado' | 'cidade' | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+$/i.test(valor.trim());

  const selecionarEstado = async (uf: string) => {
    setEstado(uf);
    setCidade('');
    setBuscaCidade('');
    setModalLocal(null);
    setCarregandoCidades(true);
    try { setCidades(await buscarCidades(uf)); setModalLocal('cidade'); }
    catch { Alert.alert('Cidades indisponíveis', 'Não foi possível carregar as cidades deste estado. Tente novamente.'); }
    finally { setCarregandoCidades(false); }
  };

  const handleRegister = async () => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!nome.trim() || !emailNormalizado || !senha || !confirmarSenha || !estado.trim() || !cidade.trim()) {
      Alert.alert('Atenção', 'Preencha nome, estado, cidade, e-mail, senha e todos os campos obrigatórios.');
      return;
    }
    if (!emailValido(emailNormalizado)) {
      Alert.alert('E-mail inválido', 'Digite um e-mail válido, como seu@email.com.');
      return;
    }
    if (senha.length < 8) {
      Alert.alert('Senha fraca', 'Use uma senha com pelo menos 8 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'A confirmação de senha não confere.');
      return;
    }
    if (!aceitouTermos) {
      Alert.alert('Termos de uso', 'Aceite os termos de uso e a política de privacidade para continuar.');
      return;
    }
    if (tipoUsuario === 'AGENTE' && !especialidade.trim()) {
      Alert.alert('Atenção', 'Informe sua área de atuação.');
      return;
    }
    if (tipoUsuario === 'CONTRATANTE' && !cpfCnpj.trim()) {
      Alert.alert('CPF/CNPJ obrigatório', 'Informe o CPF ou CNPJ do contratante.');
      return;
    }
    if (tipoUsuario === 'CONTRATANTE' && (!empresa.trim() || !categoria.trim())) {
      Alert.alert('Atenção', 'Informe a empresa e a categoria da organização.');
      return;
    }

    setCarregando(true);
    try {
      await register({
        nome: nome.trim(),
        nomeSocial: nomeSocial.trim() || undefined,
        pronomes: pronomes.trim() || undefined,
        cpfCnpj: cpfCnpj.trim() || undefined,
        email: emailNormalizado,
        senha,
        tipo: tipoUsuario,
        especialidade: especialidade.trim() || undefined,
        empresa: empresa.trim() || undefined,
        telefone: telefone.trim() || undefined,
        descricao: bio.trim() || undefined,
        site: site.trim() || undefined,
        estado: estado.trim(),
        cidade: cidade.trim(),
        endereco: endereco.trim() || undefined,
        categoria: categoria.trim() || undefined,
      });
      navigation.navigate(tipoUsuario === 'AGENTE' ? 'CreatePortfolio' : 'CustomizeProfile');
    } catch (error) {
      Alert.alert('Não foi possível criar a conta', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    options: Partial<React.ComponentProps<typeof TextInput>> = {},
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={21} color="#77716d" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#77716d"
          value={value}
          onChangeText={(value) => onChangeText(options.keyboardType === 'email-address' ? value.replace(/\s/g, '').toLowerCase() : value)}
          editable={true}
          autoComplete="off"
          importantForAutofill="no"
          {...options}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
        <View style={styles.visualHeader}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={21} color="#28232b" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ENCONTRO · TERRITÓRIO</Text>
            <Text style={styles.brand}>Arthere</Text>
            <View style={styles.brandLine} />
            <Text style={styles.headerDescription}>Crie seu espaço na rede criativa{''}da Baixada Santista.</Text>
          </View>
          <View style={styles.shapeCoral} />
          <View style={styles.shapeYellow} />
          <View style={styles.shapeBlue} />
          <View style={styles.logoArt}>
            <Image source={{ uri: ARTHERE_LOGO }} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Conte o essencial para encontrarmos as conexões certas.</Text>

          <Text style={styles.sectionTitle}>COMO VOCÊ VAI USAR A ARTHERE?</Text>
          <View style={styles.roles}>
            <TouchableOpacity style={[styles.role, tipoUsuario === 'AGENTE' && styles.roleActive]} onPress={() => setTipoUsuario('AGENTE')}>
              <Ionicons name="color-palette-outline" size={25} color={tipoUsuario === 'AGENTE' ? '#28232b' : '#77716d'} />
              <Text style={styles.roleTitle}>AGENTE CRIATIVO</Text>
              <Text style={styles.roleSub}>Artista ou profissional</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.role, tipoUsuario === 'CONTRATANTE' && styles.roleActive]} onPress={() => setTipoUsuario('CONTRATANTE')}>
              <Ionicons name="briefcase-outline" size={25} color={tipoUsuario === 'CONTRATANTE' ? '#28232b' : '#77716d'} />
              <Text style={styles.roleTitle}>CONTRATANTE</Text>
              <Text style={styles.roleSub}>Empresa ou organização</Text>
            </TouchableOpacity>
          </View>

          {renderInput('NOME COMPLETO', nome, setNome, 'Seu nome completo', 'person-outline', { autoCapitalize: 'words' })}
          {renderInput('NOME SOCIAL (OPCIONAL)', nomeSocial, setNomeSocial, 'Nome social', 'person-outline', { autoCapitalize: 'words' })}
          {renderInput('PRONOMES (OPCIONAL)', pronomes, setPronomes, 'Ex.: ela/dela, ele/dele', 'people-outline')}
          {tipoUsuario === 'CONTRATANTE' && renderInput('CPF OU CNPJ', cpfCnpj, setCpfCnpj, 'Digite CPF ou CNPJ', 'card-outline', { keyboardType: 'numeric' })}
          {tipoUsuario === 'CONTRATANTE' && renderInput('EMPRESA / ORGANIZAÇÃO', empresa, setEmpresa, 'Nome da empresa ou organização', 'business-outline', { autoCapitalize: 'words' })}
          {tipoUsuario === 'CONTRATANTE' && renderInput('SEGMENTO', categoria, setCategoria, 'Ex.: eventos, publicidade, cultura', 'briefcase-outline', { autoCapitalize: 'sentences' })}
          {tipoUsuario === 'AGENTE' && renderInput('ÁREA DE ATUAÇÃO', especialidade, setEspecialidade, 'Ex.: fotografia, design, música', 'sparkles-outline', { autoCapitalize: 'sentences' })}
          {renderInput('E-MAIL', email, setEmail, 'seu@email.com', 'mail-outline', { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
          {renderInput('TELEFONE / WHATSAPP', telefone, setTelefone, '(13) 99999-9999', 'call-outline', { keyboardType: 'phone-pad' })}
          <Text style={styles.label}>ESTADO</Text>
          <TouchableOpacity style={styles.selectWrap} onPress={() => setModalLocal('estado')}>
            <Ionicons name="map-outline" size={21} color="#77716d" />
            <Text style={[styles.selectText, !estado && styles.selectPlaceholder]}>{estado ? ESTADOS_BR.find((item) => item.sigla === estado)?.nome : 'Selecione seu estado'}</Text>
            <Ionicons name="chevron-down" size={19} color="#77716d" />
          </TouchableOpacity>
          <Text style={styles.label}>CIDADE</Text>
          <TouchableOpacity style={[styles.selectWrap, !estado && styles.selectDisabled]} disabled={!estado} onPress={() => setModalLocal('cidade')}>
            <Ionicons name="location-outline" size={21} color="#77716d" />
            <Text style={[styles.selectText, !cidade && styles.selectPlaceholder]}>{carregandoCidades ? 'Carregando cidades...' : cidade || (estado ? 'Selecione sua cidade' : 'Selecione o estado primeiro')}</Text>
            <Ionicons name="chevron-down" size={19} color="#77716d" />
          </TouchableOpacity>
          {renderInput('ENDEREÇO', endereco, setEndereco, 'Rua, número e bairro (opcional)', 'navigate-outline', { autoCapitalize: 'sentences' })}
          {tipoUsuario === 'CONTRATANTE' && renderInput('SITE', site, setSite, 'https://suaempresa.com.br', 'globe-outline', { keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false })}
          <Modal visible={modalLocal !== null} transparent animationType="slide" onRequestClose={() => setModalLocal(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{modalLocal === 'estado' ? 'Selecione seu estado' : 'Selecione sua cidade'}</Text>
                  <TouchableOpacity onPress={() => setModalLocal(null)}><Ionicons name="close" size={24} color="#302a31" /></TouchableOpacity>
                </View>
                {modalLocal === 'estado' ? (
                  <FlatList data={ESTADOS_BR} keyExtractor={(item) => item.sigla} renderItem={({ item }) => <TouchableOpacity style={styles.option} onPress={() => selecionarEstado(item.sigla)}><Text style={styles.optionText}>{item.nome}</Text><Text style={styles.optionUf}>{item.sigla}</Text></TouchableOpacity>} />
                ) : (
                  <><View style={styles.citySearchWrap}><Ionicons name="search-outline" size={19} color="#77716d" /><TextInput style={styles.citySearchInput} value={buscaCidade} onChangeText={setBuscaCidade} placeholder="Pesquisar cidade..." placeholderTextColor="#77716d" autoCapitalize="words" autoCorrect={false} /></View><FlatList data={cidades.filter((item) => item.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(buscaCidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()))} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <TouchableOpacity style={styles.option} onPress={() => { setCidade(item.nome); setBuscaCidade(''); setModalLocal(null); }}><Text style={styles.optionText}>{item.nome}</Text></TouchableOpacity>} ListEmptyComponent={<Text style={styles.emptyText}>{carregandoCidades ? 'Carregando...' : 'Nenhuma cidade encontrada.'}</Text>} /></>
                )}
              </View>
            </View>
          </Modal>

          {tipoUsuario === 'AGENTE' && renderInput('SOBRE VOCÊ', bio, setBio, 'Apresente seu trabalho em poucas palavras', 'document-text-outline', { multiline: true, numberOfLines: 3, textAlignVertical: 'top' })}

          <Text style={styles.sectionTitle}>SEGURANÇA</Text>
          {renderInput('SENHA', senha, setSenha, 'Mínimo de 8 caracteres', 'lock-closed-outline', { secureTextEntry: true, autoCapitalize: 'none' })}
          {renderInput('CONFIRMAR SENHA', confirmarSenha, setConfirmarSenha, 'Digite a senha novamente', 'shield-checkmark-outline', { secureTextEntry: true, autoCapitalize: 'none' })}

          <TouchableOpacity style={styles.termsRow} onPress={() => setAceitouTermos((value) => !value)}>
            <View style={[styles.checkbox, aceitouTermos && styles.checkboxActive]}>
              {aceitouTermos && <Ionicons name="checkmark" size={16} color="#f7f2e9" />}
            </View>
            <Text style={styles.termsText}>Li e aceito os termos de uso e a política de privacidade da Arthere.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={carregando}>
            {carregando ? (
              <ActivityIndicator color="#f7f2e9" />
            ) : (
              <>
                <Text style={styles.buttonText}>CRIAR MINHA CONTA</Text>
                <Ionicons name="arrow-forward" size={22} color="#f7f2e9" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.registerRow}>
            <Text style={styles.registerText}>Já possui uma conta?</Text>
            <Text style={styles.registerLink}>FAÇA LOGIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e9' },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  visualHeader: { height: 190, backgroundColor: '#28232b', overflow: 'hidden', position: 'relative' },
  back: { position: 'absolute', left: 18, top: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#f7f2e9', borderWidth: 1, borderColor: '#d5cec4', alignItems: 'center', justifyContent: 'center', zIndex: 6 },
  headerText: { marginLeft: 24, marginTop: 28, paddingRight: 118, zIndex: 4 },
  eyebrow: { color: '#f2c75c', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  brand: { color: '#f7f2e9', fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.6, marginTop: 5 },
  brandLine: { width: 72, height: 5, backgroundColor: '#f25b43', marginTop: 8, marginBottom: 14 },
  headerDescription: { color: '#f7f2e9', fontSize: 13, lineHeight: 19, opacity: 0.92 },
  logoArt: { position: 'absolute', right: 2, top: 34, width: 116, height: 158, zIndex: 3, shadowColor: '#f7f2e9', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 5, elevation: 4 },
  logo: { width: '100%', height: '100%', opacity: 1 },
  shapeCoral: { position: 'absolute', right: 82, top: 0, width: 52, height: 96, backgroundColor: '#f25b43', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, transform: [{ rotate: '1deg' }] },
  shapeYellow: { position: 'absolute', right: -4, top: 32, width: 94, height: 46, backgroundColor: '#f2d28b', borderRadius: 9, transform: [{ rotate: '-4deg' }] },
  shapeBlue: { position: 'absolute', right: -12, bottom: -27, width: 84, height: 102, backgroundColor: '#8ac6d8', borderTopLeftRadius: 30, transform: [{ rotate: '20deg' }] },
  form: { paddingHorizontal: 24, paddingTop: 28 },
  title: { color: '#302a31', fontSize: 30, lineHeight: 36, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#77716d', fontSize: 15, lineHeight: 21, marginBottom: 26 },
  sectionTitle: { color: '#514b4a', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginTop: 5, marginBottom: 12 },
  label: { color: '#514b4a', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8, marginTop: 2 },
  roles: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  role: { flex: 1, minHeight: 110, backgroundColor: '#fbf8f2', borderWidth: 1, borderColor: '#d5cec4', padding: 14, justifyContent: 'center', borderRadius: 18 },
  roleActive: { borderColor: '#28232b', backgroundColor: '#eee8dd', borderWidth: 2, borderRadius: 18 },
  roleTitle: { color: '#302a31', fontSize: 12, fontWeight: '900', letterSpacing: 0.7, marginTop: 8 },
  roleSub: { color: '#77716d', fontSize: 12, marginTop: 4 },
  inputWrap: { minHeight: 56, backgroundColor: '#fbf8f2', borderWidth: 1, borderColor: '#d5cec4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 18, borderRadius: 16 },
  input: { flex: 1, color: '#302a31', fontSize: 16, marginLeft: 11, paddingVertical: 12, minHeight: 54 },
  selectWrap: { minHeight: 56, backgroundColor: '#fbf8f2', borderWidth: 1, borderColor: '#d5cec4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 18, borderRadius: 16 },
  selectText: { flex: 1, color: '#302a31', fontSize: 16, marginLeft: 11 },
  selectPlaceholder: { color: '#77716d' },
  selectDisabled: { opacity: 0.55 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(40,35,43,0.45)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '78%', backgroundColor: '#f7f2e9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { color: '#302a31', fontSize: 20, fontWeight: '900' },
  option: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#e2dbd1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { color: '#302a31', fontSize: 15, fontWeight: '700' },
  optionUf: { color: '#f25b43', fontSize: 12, fontWeight: '900' },
  emptyText: { textAlign: 'center', color: '#77716d', paddingVertical: 30 },
  citySearchWrap: { minHeight: 48, borderWidth: 1, borderColor: '#d5cec4', borderRadius: 14, backgroundColor: '#fbf8f2', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 10 },
  citySearchInput: { flex: 1, color: '#302a31', fontSize: 15, marginLeft: 9, paddingVertical: 9 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 22, gap: 11 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#aaa19a', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  checkboxActive: { backgroundColor: '#28232b', borderColor: '#28232b' },
  termsText: { flex: 1, color: '#77716d', fontSize: 12, lineHeight: 18 },
  button: { minHeight: 58, backgroundColor: '#28232b', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 999 },
  buttonText: { color: '#f7f2e9', fontSize: 13, fontWeight: '900', letterSpacing: 1.3 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 24 },
  registerText: { color: '#77716d', fontSize: 13 },
  registerLink: { color: '#f25b43', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
});
