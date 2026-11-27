import { ScreenContainer, ScreenHeader, FeedbackState } from '@/shared/components';
import { Avatar } from '@/shared/components/media-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useChat, type Conversation } from '@/providers/chat-provider';
import type { ThemeTokens } from '@/shared/theme/tokens';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

function preview(conversation: Conversation) {
  const last = conversation.messages.at(-1);
  return last ? `${last.sentByMe ? 'Você: ' : ''}${last.text}` : 'Toque para iniciar uma conversa';
}

export default function ChatListScreen() {
  const { color } = useThemeTokens();
  const styles = useMemo(() => createStyles(color), [color]);
  const navigation = useNavigation<any>();
  const { conversations, refresh, loading } = useChat();
  const [erro, setErro] = useState('');
  const recarregar = useCallback(() => {
    setErro('');
    void refresh().catch(() => setErro('Não foi possível carregar as conversas. Confira sua conexão.'));
  }, [refresh]);
  useFocusEffect(recarregar);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader kicker="CONEXÕES" title="Mensagens" description="Suas conversas com pessoas e projetos." />

      <FlatList
        data={conversations}
        refreshing={loading}
        onRefresh={recarregar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={conversations.length ? styles.list : styles.empty}
        ListEmptyComponent={
          loading ? <FeedbackState kind="loading" title="Carregando conversas…" /> :
          erro ? <FeedbackState kind="error" title="Conversas indisponíveis" description={erro} onRetry={recarregar} /> :
          <FeedbackState kind="empty" icon="chatbubbles-outline" title="Nenhuma conversa ainda" description="No mapa, escolha um profissional e toque no ícone de mensagem para começar." />
        }
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() => navigation.navigate('ChatConversation', { conversationId: item.id })}
          />
        )}
      />
    </ScreenContainer>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const { color } = useThemeTokens();
  const styles = useMemo(() => createStyles(color), [color]);
  const last = conversation.messages.at(-1);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}
      accessibilityRole="button" accessibilityLabel={`Conversa com ${conversation.participant.nome}. ${preview(conversation)}`}>
      <View style={styles.avatarFrame}>
        <Avatar uri={conversation.participant.avatarUrl} style={styles.avatar} iconSize={24} />
        {conversation.participant.disponivel ? <View style={styles.online} /> : null}
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{conversation.participant.nome}</Text>
          {last ? (
            <Text style={styles.time}>
              {last.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>
        <Text style={styles.preview} numberOfLines={1}>{preview(conversation)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={color.textSecondary} />
    </TouchableOpacity>
  );
}

const createStyles = (color: ThemeTokens['color']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  kicker: {
    color: color.accentText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    color: color.textPrimary,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: color.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: color.border,
    marginHorizontal: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    gap: 11,
  },
  avatarFrame: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: color.textPrimary,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
  },
  avatarInitials: {
    color: color.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  online: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: color.success,
    borderWidth: 2,
    borderColor: color.background,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  time: {
    color: color.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  preview: {
    color: color.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyGraphic: {
    width: 72,
    height: 72,
    backgroundColor: color.brandInk,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyGraphicCoral: {
    position: 'absolute',
    width: 42,
    height: 42,
    right: -11,
    bottom: -11,
    borderRadius: 10,
    backgroundColor: color.accent,
    transform: [{ rotate: '20deg' }],
  },
  emptyTitle: {
    color: color.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 16,
  },
  emptyText: {
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    fontSize: 12,
  },
});
