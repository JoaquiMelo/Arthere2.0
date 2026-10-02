import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ARTHERE_LOGO } from '@/shared/assets/artHere-logo';

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.visual}>
        <View style={styles.shapeCoral} />
        <View style={styles.shapeYellow} />
        <View style={styles.shapeBlue} />

        <View style={styles.logoWrap}>
          <Image source={{ uri: ARTHERE_LOGO }} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.brandBlock}>
          <Text style={styles.eyebrow}>ENCONTRO · TERRITÓRIO</Text>
          <Text style={styles.brand}>Arthere</Text>
          <View style={styles.line} />
          <Text style={styles.description}>
            Conectando talentos criativos, projetos e oportunidades na Baixada Santista.
          </Text>
        </View>

        <View style={styles.bottomGraphic}>
          <Ionicons name="sparkles-outline" size={30} color="#f2c75c" />
          <Text style={styles.graphicText}>CULTURA · CRIATIVIDADE · CONEXÃO</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Encontre seu espaço criativo.</Text>
        <Text style={styles.subtitle}>
          Explore profissionais, oportunidades e eventos ou faça parte da rede Arthere.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>CRIAR CONTA</Text>
          <Ionicons name="arrow-forward" size={22} color="#f7f2e9" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Ionicons name="log-in-outline" size={21} color="#28232b" />
          <Text style={styles.secondaryText}>JÁ TENHO UMA CONTA</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>ARTHERE · ECONOMIA CRIATIVA</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f2e9',
  },
  visual: {
    flex: 1.15,
    minHeight: 390,
    backgroundColor: '#28232b',
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 24,
    paddingTop: 38,
  },
  brandBlock: {
    zIndex: 4,
    marginTop: 8,
    paddingRight: 108,
  },
  eyebrow: {
    color: '#f2c75c',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  brand: {
    color: '#f7f2e9',
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -2,
    marginTop: 7,
  },
  line: {
    width: 82,
    height: 5,
    backgroundColor: '#f25b43',
    marginTop: 10,
    marginBottom: 16,
  },
  description: {
    color: '#f7f2e9',
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.92,
  },
  logoWrap: {
    position: 'absolute',
    right: 3,
    top: 32,
    width: 128,
    height: 172,
    zIndex: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  shapeCoral: {
    position: 'absolute',
    right: 90,
    top: 0,
    width: 56,
    height: 116,
    backgroundColor: '#f25b43',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    transform: [{ rotate: '2deg' }],
  },
  shapeYellow: {
    position: 'absolute',
    right: -8,
    top: 46,
    width: 102,
    height: 52,
    backgroundColor: '#f2d28b',
    borderRadius: 10,
    transform: [{ rotate: '-5deg' }],
  },
  shapeBlue: {
    position: 'absolute',
    right: -18,
    bottom: -34,
    width: 108,
    height: 132,
    backgroundColor: '#8ac6d8',
    borderTopLeftRadius: 38,
    transform: [{ rotate: '18deg' }],
  },
  bottomGraphic: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 30,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  graphicText: {
    color: '#f7f2e9',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  content: {
    flex: 0.85,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
    justifyContent: 'center',
  },
  title: {
    color: '#302a31',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#77716d',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  primaryButton: {
    minHeight: 58,
    backgroundColor: '#28232b',
    borderRadius: 999,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryText: {
    color: '#f7f2e9',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  secondaryButton: {
    minHeight: 54,
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#28232b',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryText: {
    color: '#28232b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  footer: {
    color: '#aaa39b',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    textAlign: 'center',
    marginTop: 18,
  },
});
