import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '@/providers/user-provider';
import { ARTHERE_LOGO } from '@/shared/assets/artHere-logo';

type TipoUsuario = 'AGENTE' | 'CONTRATANTE';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { updateProfile } = useUser();
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('AGENTE');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [bio, setBio] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [categoria, setCategoria] = useState('');
  const [telefone, setTelefone] = useState('');
  const [site, setSite] = useState('');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleRegister = async () => {
    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha || !cidade.trim()) {
      Alert.alert('Atenção', 'Preencha nome, e-mail, senha, cidade e todos os campos obrigatórios.');
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
    if (tipoUsuario === 'CONTRATANTE' && (!empresa.trim() || !categoria.trim())) {
      Alert.alert('Atenção', 'Informe a empresa e a categoria da organização.');
      return;
    }

    setCarregando(true);

    // Cadastro temporário: os dados ficam apenas no estado local do app.
    updateProfile({
      id: `local-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      tipo: tipoUsuario,
      especialidade: especialidade.trim(),
      empresa: empresa.trim(),
      telefone: telefone.trim(),
      descricao: bio.trim(),
      bio: bio.trim(),
      site: site.trim(),
      cidade: cidade.trim(),
      endereco: endereco.trim(),
      categoria: categoria.trim(),
    });

    setCarregando(false);
    navigation.navigate(tipoUsuario === 'AGENTE' ? 'CreatePortfolio' : 'CustomizeProfile');
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
          onChangeText={onChangeText}
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
          {tipoUsuario === 'CONTRATANTE' && renderInput('EMPRESA / ORGANIZAÇÃO', empresa, setEmpresa, 'Nome da empresa ou organização', 'business-outline', { autoCapitalize: 'words' })}
          {tipoUsuario === 'CONTRATANTE' && renderInput('SEGMENTO', categoria, setCategoria, 'Ex.: eventos, publicidade, cultura', 'briefcase-outline', { autoCapitalize: 'sentences' })}
          {tipoUsuario === 'AGENTE' && renderInput('ÁREA DE ATUAÇÃO', especialidade, setEspecialidade, 'Ex.: fotografia, design, música', 'sparkles-outline', { autoCapitalize: 'sentences' })}
          {renderInput('E-MAIL', email, setEmail, 'seu@email.com', 'mail-outline', { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
          {renderInput('TELEFONE / WHATSAPP', telefone, setTelefone, '(13) 99999-9999', 'call-outline', { keyboardType: 'phone-pad' })}
          {renderInput('CIDADE', cidade, setCidade, 'Ex.: Santos - SP', 'location-outline', { autoCapitalize: 'words' })}
          {renderInput('ENDEREÇO', endereco, setEndereco, 'Rua, número e bairro (opcional)', 'navigate-outline', { autoCapitalize: 'sentences' })}
          {tipoUsuario === 'CONTRATANTE' && renderInput('SITE', site, setSite, 'https://suaempresa.com.br', 'globe-outline', { keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false })}
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
