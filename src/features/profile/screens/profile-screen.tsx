import { colors } from '@/shared/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ReviewList } from '@/features/reviews/components/review-list';
import { useReviews } from '@/providers/reviews-provider';
import { useUser } from '@/providers/user-provider';
import ContratanteProfileScreen from './contratante-profile-screen';

const { width } = Dimensions.get('window');
const galleryItemSize = (width - 52) / 3;

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
  id: '1',
  nome: 'Marina Oliveira',
  especialidade: 'Fotógrafa e videomaker',
  bio: 'Transformo momentos em imagens com personalidade. Disponível para ensaios, eventos e projetos autorais.',
  cidade: 'Santos, SP',
  avatarUrl: 'https://i.pravatar.cc/300?img=47',
  notaMedia: 4.8,
  totalAvaliacoes: 127,
  totalProjetos: 94,
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
  const { user } = useUser();

  if (user.tipo === 'CONTRATANTE') {
    return <ContratanteProfileScreen />;
  }

  return <AgenteProfileScreenContent />;
}

function AgenteProfileScreenContent() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const [abaAtiva, setAbaAtiva] = useState<'portfolio' | 'sobre' | 'avaliacoes'>('portfolio');
  const agente: AgentePerfil = {
    id: user.id,
    nome: user.nome || 'Seu nome',
    especialidade: user.especialidade || 'Profissional criativo',
    bio: user.bio || 'Adicione uma apresentação sobre seu trabalho.',
    cidade: user.cidade || 'Cidade não informada',
    avatarUrl: user.avatarUrl || 'https://i.pravatar.cc/300?img=12',
    notaMedia: Number(user.notaMedia ?? 0),
    totalAvaliacoes: Number(user.totalAvaliacoes ?? 0),
    totalProjetos: Number(user.totalProjetos ?? 0),
    portfolio: Array.isArray(user.portfolio) ? user.portfolio.map((item:any) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      titulo: item.titulo ?? undefined,
      descricao: item.descricao ?? undefined,
    })) : [],
  };
  const { avaliacoesPorAgente, mediaPorAgente } = useReviews();
  const avaliacoes = avaliacoesPorAgente(agente.id);
  const media = avaliacoes.length ? mediaPorAgente(agente.id) : agente.notaMedia;
  const totalAvaliacoes = avaliacoes.length || agente.totalAvaliacoes;

  const abrirEdicaoPerfil = () => navigation.navigate('EditProfile', { agente });
  const abrirEdicaoPortfolio = () =>
    navigation.navigate('PortfolioCreation', { portfolio: agente.portfolio });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
            }}
            style={styles.coverImage}
          />
          <View style={styles.coverOverlay} />

          <View style={styles.coverLabel}>
            <Text style={styles.coverLabelText}>PERFIL · AGENTE CRIATIVO</Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.topIcon}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Abrir configurações"
            >
              <Ionicons name="settings-outline" size={19} color={colors.brandPaper} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIcon} accessibilityLabel="Compartilhar perfil">
              <Ionicons name="share-social-outline" size={19} color={colors.brandPaper} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileIntro}>
          <TouchableOpacity
            style={styles.avatarFrame}
            onPress={abrirEdicaoPerfil}
            accessibilityLabel="Editar foto de perfil"
          >
            <Image source={{ uri: agente.avatarUrl }} style={styles.avatar} />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={13} color={colors.brandPaper} />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{agente.nome}</Text>
          <View style={styles.roleRow}>
            <View style={styles.roleDot} />
            <Text style={styles.role}>{agente.especialidade}</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.brandTerracotta} />
            <Text style={styles.location}>{agente.cidade}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{agente.totalProjetos}</Text>
              <Text style={styles.statLabel}>PROJETOS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{totalAvaliacoes}</Text>
              <Text style={styles.statLabel}>AVALIAÇÕES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{media.toFixed(1)}</Text>
              <Text style={styles.statLabel}>NOTA MÉDIA</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={abrirEdicaoPerfil}>
              <Ionicons name="create-outline" size={16} color={colors.brandPaper} />
              <Text style={styles.primaryButtonText}>EDITAR PERFIL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={abrirEdicaoPortfolio}>
              <Ionicons name="images-outline" size={16} color={colors.brandInk} />
              <Text style={styles.secondaryButtonText}>PORTFÓLIO</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          {([
            ['portfolio', 'FOTOS'],
            ['sobre', 'SOBRE'],
            ['avaliacoes', 'AVALIAÇÕES'],
          ] as const).map(([id, label]) => (
            <TouchableOpacity
              key={id}
              style={[styles.tab, abaAtiva === id && styles.tabActive]}
              onPress={() => setAbaAtiva(id)}
            >
              <Text style={[styles.tabText, abaAtiva === id && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {abaAtiva === 'portfolio' ? (
          <View style={styles.gallerySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>PORTFÓLIO</Text>
                <Text style={styles.sectionTitle}>Trabalhos recentes</Text>
              </View>
              <TouchableOpacity onPress={abrirEdicaoPortfolio}>
                <Text style={styles.actionText}>GERENCIAR</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gallery}>
              {agente.portfolio.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.galleryItem}
                  onPress={abrirEdicaoPortfolio}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addWork}
                onPress={abrirEdicaoPortfolio}
                accessibilityLabel="Adicionar trabalho ao portfólio"
              >
                <Ionicons name="add" size={26} color={colors.brandInk} />
                <Text style={styles.addWorkText}>NOVO</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {abaAtiva === 'sobre' ? (
          <View style={styles.aboutCard}>
            <Text style={styles.sectionKicker}>APRESENTAÇÃO</Text>
            <Text style={styles.aboutTitle}>Sobre meu trabalho</Text>
            <Text style={styles.aboutText}>{agente.bio}</Text>

            <TouchableOpacity style={styles.editBio} onPress={abrirEdicaoPerfil}>
              <Text style={styles.editBioText}>EDITAR APRESENTAÇÃO</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.brandCoral} />
            </TouchableOpacity>
          </View>
        ) : null}

        {abaAtiva === 'avaliacoes' ? (
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>FEEDBACK</Text>
                <Text style={styles.sectionTitle}>O que dizem sobre você</Text>
              </View>
            </View>
            <ReviewList avaliacoes={avaliacoes} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPaper,
  },
  scrollContent: {
    paddingBottom: 42,
  },
  coverContainer: {
    height: 198,
    overflow: 'hidden',
    backgroundColor: colors.brandInk,
    position: 'relative',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  coverLabel: {
    position: 'absolute',
    left: 16,
    bottom: 14,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: colors.brandInk,
    borderRadius: 10,
  },
  coverLabelText: {
    color: colors.brandSand,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.25,
  },
  topActions: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    gap: 7,
  },
  topIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(246,241,232,0.36)',
    backgroundColor: 'rgba(41,36,43,0.55)',
  },
  profileIntro: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarFrame: {
    marginTop: -54,
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.brandPaper,
    backgroundColor: colors.white,
    position: 'relative',
    overflow: 'hidden',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  cameraBadge: {
    position: 'absolute',
    right: -1,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandCoral,
    borderWidth: 2,
    borderColor: colors.brandPaper,
  },
  name: {
    marginTop: 12,
    color: colors.brandInk,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brandCoral,
  },
  role: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  location: {
    color: colors.muted,
    fontSize: 12,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.brandInk,
    fontSize: 19,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 9,
    width: '100%',
    marginTop: 17,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.brandInk,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButtonText: {
    color: colors.brandPaper,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.brandInk,
    backgroundColor: colors.brandSand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    color: colors.brandInk,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brandCoral,
  },
  tabText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.brandInk,
  },
  gallerySection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  sectionKicker: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  sectionTitle: {
    color: colors.brandInk,
    fontSize: 18,
    fontWeight: '900',
  },
  actionText: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  galleryItem: {
    width: galleryItemSize,
    height: galleryItemSize,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  addWork: {
    width: galleryItemSize,
    height: galleryItemSize,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brandInk,
    backgroundColor: colors.brandBlue,
  },
  addWorkText: {
    color: colors.brandInk,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  aboutCard: {
    margin: 20,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  aboutTitle: {
    color: colors.brandInk,
    fontSize: 19,
    fontWeight: '900',
  },
  aboutText: {
    marginTop: 11,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  editBio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.brandSand,
  },
  editBioText: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
