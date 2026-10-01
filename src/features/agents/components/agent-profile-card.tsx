import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CATEGORIAS } from '../../../shared/config/categories';
import type { AgenteCriativo } from '@/features/agents/types/agent';
import { StarRating } from '../../reviews/components/star-rating';
import { useReviews } from '../../../providers/reviews-provider';
import { colors } from '@/shared/theme/colors';

interface Props {
  agente: AgenteCriativo | null;
  visible: boolean;
  onClose: () => void;
  onAgendar: (agente: AgenteCriativo) => void;
  onChat: (agente: AgenteCriativo) => void;
}

export function AgentProfileCard({
  agente,
  visible,
  onClose,
  onAgendar,
  onChat,
}: Props) {
  const { avaliacoesPorAgente, mediaPorAgente } = useReviews();

  if (!agente) return null;

  const categoria = CATEGORIAS[agente.categoria] ?? CATEGORIAS.design;
  const avaliacao = typeof agente.avaliacao === 'number' ? agente.avaliacao : 0;
  const avaliacoes = avaliacoesPorAgente(agente.id);
  const media = avaliacoes.length ? mediaPorAgente(agente.id) : avaliacao;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.topRule} />

        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Fechar">
          <Ionicons name="close" size={19} color={colors.muted} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.avatarFrame}>
            <Image source={{ uri: agente.avatarUrl }} style={styles.avatar} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: categoria.cor }]} />
              <Text style={[styles.categoryText, { color: categoria.cor }]}>
                {categoria.label.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.nome}>{agente.nome}</Text>
            <Text style={styles.especialidade}>{agente.especialidades?.[0] ?? 'Profissional criativo'}</Text>

            {agente.disponivel ? (
              <Text style={styles.disponivel}>DISPONÍVEL AGORA</Text>
            ) : (
              <Text style={styles.indisponivel}>EM PROJETO</Text>
            )}
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <StarRating value={media} size={12} />
            <Text style={styles.metaStrong}>{media.toFixed(1)}</Text>
            <Text style={styles.metaMuted}>({avaliacoes.length})</Text>
          </View>
          <View style={styles.metaSeparator} />
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.brandTerracotta} />
            <Text style={styles.metaMuted}>{agente.cidade}</Text>
          </View>
        </View>

        <Text style={styles.descricao}>{agente.descricao}</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PORTFÓLIO</Text>
          <View style={styles.sectionRule} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.portfolioList}
        >
          {agente.portfolio.map((item) => (
            <View key={item.id} style={styles.portfolioItem}>
              {item.imagemUrl ? (
                <Image source={{ uri: item.imagemUrl }} style={styles.portfolioImagem} />
              ) : (
                <View style={styles.placeholder} />
              )}
              <Text style={styles.portfolioTexto} numberOfLines={1}>
                {item.titulo}
              </Text>
            </View>
          ))}
        </ScrollView>

        {avaliacoes.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AVALIAÇÕES</Text>
              <View style={styles.sectionRule} />
            </View>

            {avaliacoes.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAutor}>{item.autorNome}</Text>
                  <StarRating value={item.nota} size={11} />
                </View>
                {item.comentario ? (
                  <Text style={styles.reviewTexto} numberOfLines={2}>
                    {item.comentario}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        <View style={styles.acoes}>
          <TouchableOpacity style={styles.agendar} onPress={() => onAgendar(agente)}>
            <Text style={styles.agendarTexto}>AGENDAR</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.brandPaper} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.chat} onPress={() => onChat(agente)}>
            <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.brandInk} />
            <Text style={styles.chatText}>CONVERSAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41,36,43,0.44)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '86%',
    backgroundColor: colors.brandPaper,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.brandInk,
  },
  topRule: {
    width: 44,
    height: 4,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 15,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 14,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
    paddingRight: 40,
  },
  avatarFrame: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: colors.brandInk,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  nome: {
    color: colors.brandInk,
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 3,
  },
  especialidade: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  disponivel: {
    color: colors.brandGreen,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginTop: 7,
  },
  indisponivel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginTop: 7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaStrong: {
    color: colors.brandInk,
    fontSize: 11,
    fontWeight: '900',
  },
  metaMuted: {
    color: colors.muted,
    fontSize: 11,
  },
  metaSeparator: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  descricao: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 17,
    marginBottom: 9,
  },
  sectionTitle: {
    color: colors.brandInk,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  portfolioList: {
    paddingRight: 4,
    gap: 10,
  },
  portfolioItem: {
    width: 102,
  },
  portfolioImagem: {
    width: 102,
    height: 76,
    backgroundColor: colors.surface,
  },
  placeholder: {
    width: 102,
    height: 76,
    backgroundColor: colors.surface,
  },
  portfolioTexto: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 4,
  },
  reviewItem: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 7,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAutor: {
    color: colors.brandInk,
    fontSize: 11,
    fontWeight: '800',
  },
  reviewTexto: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  acoes: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  agendar: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.brandInk,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agendarTexto: {
    color: colors.brandPaper,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  chat: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.brandInk,
    backgroundColor: colors.brandSand,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chatText: {
    color: colors.brandInk,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
});
