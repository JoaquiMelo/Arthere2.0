import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Avatar, Badge, Button, IconButton, MediaImage, SectionHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { AgenteCriativo } from '@/features/agents/types/agent';
import { categoryLabel } from '@/features/map/utils/map-agents';
import { useReviews } from '@/providers/reviews-provider';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

interface Props {
  agente: AgenteCriativo | null;
  visible: boolean;
  onClose: () => void;
  onAgendar: (agente: AgenteCriativo) => void;
  onChat: (agente: AgenteCriativo) => void;
  onVerPerfil: (agente: AgenteCriativo) => void;
  canChat?: boolean;
  chatLoading?: boolean;
  chatLabel?: string;
}

export function AgentProfileCard({ agente, visible, onClose, onAgendar, onChat, onVerPerfil, canChat = true, chatLoading = false, chatLabel = 'Conversar' }: Props) {
  const { color, spacing, radius, dimensions } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { avaliacoesPorAgente, mediaPorAgente, carregarAvaliacoes } = useReviews();
  const agenteId = agente?.id;

  useEffect(() => {
    if (visible && agenteId) void carregarAvaliacoes(agenteId).catch(() => undefined);
  }, [visible, agenteId, carregarAvaliacoes]);

  if (!agente) return null;
  const avaliacoes = avaliacoesPorAgente(agente.id);
  const media = avaliacoes.length ? mediaPorAgente(agente.id) : agente.avaliacao;

  return (
    <Modal visible={visible} animationType={reducedMotion ? 'fade' : 'slide'} transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: color.overlay }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar detalhes do profissional" />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: color.surface, borderTopLeftRadius: radius.sheetCompact, borderTopRightRadius: radius.sheetCompact, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <View style={{ width: 36, height: 4, borderRadius: radius.xs, backgroundColor: color.accentSecondary }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
            <AppText variant="label" color="textSecondary" weight="semibold">Profissional criativo</AppText>
            <IconButton icon="close" accessibilityLabel="Fechar detalhes" variant="ghost" onPress={onClose} />
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar uri={agente.avatarUrl} style={{ width: 80, height: 80, borderRadius: radius.cardCompact }} iconSize={32} />
              <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                <AppText variant="label" color="accentText" weight="bold">{categoryLabel(agente.categoria)}</AppText>
                <AppText variant="h2" weight="heavy" accessibilityRole="header">{agente.nome}</AppText>
                <AppText variant="bodySmall" color="textSecondary">{agente.especialidades[0]}</AppText>
                {agente.disponivel === true ? <Badge label="Disponível agora" tone="success" icon="checkmark-circle-outline" /> :
                  agente.disponivel === false ? <Badge label="Indisponível no momento" tone="neutral" /> : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.control, backgroundColor: color.background }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="location-outline" size={dimensions.icon.small} color={color.accentText} />
                <AppText variant="bodySmall" color="textSecondary">{agente.cidade}</AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Ionicons name="star-outline" size={dimensions.icon.small} color={color.accentText} />
                <AppText variant="bodySmall" weight="semibold">{media > 0 ? media.toFixed(1) : 'Sem avaliações'}</AppText>
                {avaliacoes.length > 0 ? <AppText variant="bodySmall" color="textSecondary">({avaliacoes.length})</AppText> : null}
              </View>
            </View>

            {agente.descricao.trim() ? <AppText>{agente.descricao}</AppText> : null}

            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="Portfólio" />
              {agente.portfolio.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                  {agente.portfolio.map((item) => (
                    <View key={item.id} style={{ width: 152, gap: spacing.xs }}>
                      <MediaImage uri={item.imagemUrl} style={{ width: 152, height: 106, borderRadius: radius.control }} />
                      <AppText variant="bodySmall" weight="medium" numberOfLines={2}>{item.titulo}</AppText>
                    </View>
                  ))}
                </ScrollView>
              ) : <AppText color="textSecondary" variant="bodySmall">Nenhum trabalho publicado ainda.</AppText>}
            </View>

            {avaliacoes.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title="Avaliações" />
                {avaliacoes.slice(0, 2).map((item) => (
                  <View key={item.id} style={{ gap: spacing.xs, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <AppText weight="semibold" variant="bodySmall" style={{ flex: 1 }}>{item.autorNome}</AppText>
                      <AppText variant="bodySmall" color="accentText" weight="semibold">★ {item.nota}</AppText>
                    </View>
                    {item.comentario ? <AppText variant="bodySmall" color="textSecondary">{item.comentario}</AppText> : null}
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={{ paddingTop: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: color.border }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button variant="outline" style={{ flexGrow: 1, borderRadius: radius.control }} onPress={() => onVerPerfil(agente)}>Ver perfil completo</Button>
              {canChat ? <Button style={{ flexGrow: 1, borderRadius: radius.control }} loading={chatLoading} onPress={() => onChat(agente)}>{chatLabel}</Button> : null}
            </View>
            {canChat ? <Button variant="ghost" size="small" fullWidth style={{ borderRadius: radius.control }} onPress={() => onAgendar(agente)}>Sobre agendamento</Button> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', width: '100%', flexShrink: 1 },
  body: { flexGrow: 0, flexShrink: 1 },
});
