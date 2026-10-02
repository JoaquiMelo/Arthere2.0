import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '@/providers/user-provider';
import { ARTHERE_LOGO } from '@/shared/assets/artHere-logo';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const emailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(valor.trim());

  const handleLogin = async () => {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado || !senha) {
      Alert.alert('Atenção', 'Informe o e-mail e a senha.');
      return;
    }
    if (!emailValido(emailNormalizado)) {
      Alert.alert('E-mail inválido', 'Digite um e-mail válido, como seu@email.com.');
      return;
    }
    try {
      setCarregando(true);
      if (login) await login(emailNormalizado, senha);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch {
      Alert.alert('Erro', 'E-mail ou senha inválidos. Verifique seus dados e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.visualHeader}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>ENCONTRO · TERRITÓRIO</Text>
          <Text style={styles.brand}>Arthere</Text>
          <View style={styles.brandLine} />
          <Text style={styles.headerDescription}>
            Conectando talentos criativos e{''}projetos na Baixada Santista.
          </Text>
        </View>
        <View style={styles.logoArt}>
          <Image source={{ uri: ARTHERE_LOGO }} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.shapeCoral} />
        <View style={styles.shapeYellow} />
        <View style={styles.shapeBlue} />
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Acesse seu espaço criativo.</Text>

        <Text style={styles.label}>E-MAIL</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={22} color="#77716d" />
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#77716d"
            value={email}
            onChangeText={(value) => setEmail(value.replace(/\s/g, '').toLowerCase())}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.passwordLabelRow}>
          <Text style={styles.label}>SENHA</Text>
          <TouchableOpacity onPress={() => Alert.alert('Recuperar senha', 'Em breve você poderá redefinir sua senha por e-mail.')}>
            <Text style={styles.forgot}>ESQUECI A SENHA</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={22} color="#77716d" />
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#77716d"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setMostrarSenha((value) => !value)} hitSlop={10}>
            <Ionicons name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} size={22} color="#77716d" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator color="#f7f2e9" />
          ) : (
            <>
              <Text style={styles.buttonText}>ENTRAR</Text>
              <Ionicons name="arrow-forward" size={22} color="#f7f2e9" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Ainda não tem uma conta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>CRIAR CONTA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e9' },
  visualHeader: { height: 190, backgroundColor: '#28232b', overflow: 'hidden', position: 'relative' },
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
  form: { paddingHorizontal: 24, paddingTop: 28, flex: 1 },
  title: { color: '#302a31', fontSize: 30, lineHeight: 36, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#77716d', fontSize: 15, marginBottom: 28 },
  label: { color: '#514b4a', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  passwordLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  forgot: { color: '#f25b43', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: { minHeight: 56, backgroundColor: '#fbf8f2', borderWidth: 1, borderColor: '#d5cec4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20, borderRadius: 16 },
  input: { flex: 1, color: '#302a31', fontSize: 16, marginLeft: 11, paddingVertical: 12 },
  button: { minHeight: 58, backgroundColor: '#28232b', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, borderRadius: 999 },
  buttonText: { color: '#f7f2e9', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 24 },
  registerText: { color: '#77716d', fontSize: 13 },
  registerLink: { color: '#f25b43', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
});
