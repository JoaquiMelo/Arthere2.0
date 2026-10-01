
import { colors } from '@/shared/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const galleryItemSize = (width - 48) / 3;

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  titulo?: string;
  descricao?: string;
}

export interface AgentePerfil {
  id: string;
  nome: string;
  especialidade: string;
  bio: string;
  cidade: string;
  avatarUrl: string;
  notaMedia: number;
  totalAvaliacoes: number;
  totalProjetos: number;
  portfolio: PortfolioItem[];
}

export const MOCK_AGENT_PROFILE: AgentePerfil = {
  id: '1', nome: 'Marina Oliveira', especialidade: 'Fotógrafa e videomaker',
  bio: 'Transformo momentos em imagens com personalidade. Disponível para ensaios, eventos e projetos autorais.',
  cidade: 'Santos, SP', avatarUrl: 'https://i.pravatar.cc/300?img=47', notaMedia: 4.8, totalAvaliacoes: 127, totalProjetos: 94,
  portfolio: [
    { id: 'p1', imageUrl: 'https://picsum.photos/seed/arthere-1/400/400', titulo: 'Ensaio urbano' },
    { id: 'p2', imageUrl: 'https://picsum.photos/seed/arthere-2/400/400', titulo: 'Casamento Ana & Bruno' },
    { id: 'p3', imageUrl: 'https://picsum.photos/seed/arthere-3/400/400', titulo: 'Editorial de moda' },
    { id: 'p4', imageUrl: 'https://picsum.photos/seed/arthere-4/400/400', titulo: 'Evento cultural' },
    { id: 'p5', imageUrl: 'https://picsum.photos/seed/arthere-5/400/400', titulo: 'Retrato' },
    { id: 'p6', imageUrl: 'https://picsum.photos/seed/arthere-6/400/400', titulo: 'Produto' },
  ],
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [abaAtiva, setAbaAtiva] = useState<'portfolio' | 'sobre'>('portfolio');
  const agente = MOCK_AGENT_PROFILE;
  const abrirEdicaoPerfil = () => navigation.navigate('EditProfile', { agente });
  const abrirEdicaoPortfolio = () => navigation.navigate('PortfolioCreation', { portfolio: agente.portfolio });
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate('Settings')} accessibilityLabel="Abrir configurações"><Ionicons name="settings-outline" size={21} color={colors.white} /></TouchableOpacity>
            <TouchableOpacity style={styles.topIcon} accessibilityLabel="Compartilhar perfil"><Ionicons name="share-social-outline" size={21} color={colors.white} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileIntro}>
          <TouchableOpacity style={styles.avatarFrame} onPress={abrirEdicaoPerfil} accessibilityLabel="Editar foto de perfil">
            <Image source={{ uri: agente.avatarUrl }} style={styles.avatar} />
            <View style={styles.cameraBadge}><Ionicons name="camera" size={14} color={colors.white} /></View>
          </TouchableOpacity>
          <Text style={styles.name}>{agente.nome}</Text>
          <Text style={styles.role}>{agente.especialidade}</Text>
          <View style={styles.locationRow}><Ionicons name="location" size={15} color={colors.orange} /><Text style={styles.location}>{agente.cidade}</Text></View>

          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statNumber}>{agente.totalProjetos}</Text><Text style={styles.statLabel}>projetos</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statNumber}>{agente.totalAvaliacoes}</Text><Text style={styles.statLabel}>avaliações</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statNumber}>{agente.notaMedia}</Text><Text style={styles.statLabel}>nota média</Text></View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={abrirEdicaoPerfil}><Ionicons name="create-outline" size={17} color={colors.white} /><Text style={styles.primaryButtonText}>Editar perfil</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={abrirEdicaoPortfolio}><Ionicons name="images-outline" size={17} color={colors.text} /><Text style={styles.secondaryButtonText}>Portfólio</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, abaAtiva === 'portfolio' && styles.tabActive]} onPress={() => setAbaAtiva('portfolio')}><Text style={[styles.tabText, abaAtiva === 'portfolio' && styles.tabTextActive]}>Fotos</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, abaAtiva === 'sobre' && styles.tabActive]} onPress={() => setAbaAtiva('sobre')}><Text style={[styles.tabText, abaAtiva === 'sobre' && styles.tabTextActive]}>Sobre</Text></TouchableOpacity>
        </View>

        {abaAtiva === 'portfolio' ? (
          <View style={styles.gallerySection}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Trabalhos recentes</Text><TouchableOpacity onPress={abrirEdicaoPortfolio}><Text style={styles.actionText}>Gerenciar</Text></TouchableOpacity></View>
            <View style={styles.gallery}>
              {agente.portfolio.map((item) => <TouchableOpacity key={item.id} style={styles.galleryItem} onPress={abrirEdicaoPortfolio}><Image source={{ uri: item.imageUrl }} style={styles.galleryImage} /></TouchableOpacity>)}
              <TouchableOpacity style={styles.addWork} onPress={abrirEdicaoPortfolio} accessibilityLabel="Adicionar trabalho ao portfólio"><Ionicons name="add" size={29} color={colors.primaryDark} /></TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.aboutCard}>
            <View style={styles.aboutTitleRow}><Ionicons name="person-circle-outline" size={22} color={colors.primaryDark} /><Text style={styles.sectionTitle}>Sobre mim</Text></View>
            <Text style={styles.aboutText}>{agente.bio}</Text>
            <TouchableOpacity style={styles.editBio} onPress={abrirEdicaoPerfil}><Text style={styles.editBioText}>Editar apresentação</Text><Ionicons name="arrow-forward" size={16} color={colors.primaryDark} /></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, scrollContent: { paddingBottom: 42 },
  coverContainer: { height: 196, overflow: 'hidden', backgroundColor: colors.secondary }, coverImage: { width: '100%', height: '100%' }, coverOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20,42,45,0.18)' },
  topActions: { position: 'absolute', top: 14, right: 16, flexDirection: 'row', gap: 10 }, topIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)' },
  profileIntro: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 }, avatarFrame: { marginTop: -57, borderRadius: 62, borderWidth: 4, borderColor: colors.white, position: 'relative' }, avatar: { width: 116, height: 116, borderRadius: 58 },
  cameraBadge: { position: 'absolute', right: -2, bottom: 2, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: colors.white }, name: { marginTop: 11, color: colors.text, fontSize: 22, fontWeight: '800' }, role: { marginTop: 3, color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 }, location: { color: colors.muted, fontSize: 13 }, statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 }, stat: { width: 82, alignItems: 'center' }, statNumber: { color: colors.text, fontSize: 18, fontWeight: '800' }, statLabel: { marginTop: 2, color: colors.muted, fontSize: 11 }, statDivider: { width: StyleSheet.hairlineWidth, height: 27, backgroundColor: colors.border },
  buttonRow: { flexDirection: 'row', gap: 9, width: '100%', marginTop: 20 }, primaryButton: { flex: 1, height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.primaryDark }, primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' }, secondaryButton: { flex: 1, height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: colors.accent, backgroundColor: '#FFF9E8' }, secondaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  tabs: { flexDirection: 'row', marginTop: 4, borderBottomWidth: 1, borderBottomColor: colors.border }, tab: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: colors.primary }, tabText: { color: colors.muted, fontSize: 13, fontWeight: '600' }, tabTextActive: { color: colors.text, fontWeight: '800' },
  gallerySection: { paddingHorizontal: 16, paddingTop: 19 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' }, actionText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' }, gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, galleryItem: { width: galleryItemSize, height: galleryItemSize, borderRadius: 10, overflow: 'hidden' }, galleryImage: { width: '100%', height: '100%' }, addWork: { width: galleryItemSize, height: galleryItemSize, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary },
  aboutCard: { margin: 20, padding: 18, borderRadius: 14, backgroundColor: colors.surface }, aboutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, aboutText: { marginTop: 14, color: colors.muted, fontSize: 14, lineHeight: 21 }, editBio: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 18 }, editBioText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
});
