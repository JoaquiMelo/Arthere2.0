import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useChat, type Conversation } from '@/providers/chat-provider';
import { colors } from '@/shared/theme/colors';

function preview(conversation: Conversation) {
  const last = conversation.messages.at(-1);
  return last ? `${last.sentByMe ? 'Você: ' : ''}${last.text}` : 'Toque para iniciar uma conversa';
}

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { conversations } = useChat();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>CONEXÕES</Text>
        <Text style={styles.title}>Mensagens</Text>
        <Text style={styles.subtitle}>Suas conversas com pessoas e projetos.</Text>
      </View>
      <View style={styles.divider} />

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={conversations.length ? styles.list : styles.empty}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <View style={styles.emptyGraphic}>
              <View style={styles.emptyGraphicCoral} />
              <Ionicons name="chatbubbles-outline" size={28} color={colors.brandPaper} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyText}>
              No mapa, escolha um profissional e toque no ícone de mensagem para começar.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() => navigation.navigate('ChatConversation', { conversationId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const last = conversation.messages.at(-1);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.avatarFrame}>
        <Image source={{ uri: conversation.participant.avatarUrl }} style={styles.avatar} />
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

      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPaper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  kicker: {
    color: colors.brandCoral,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    color: colors.brandInk,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
    borderBottomColor: colors.border,
    gap: 11,
  },
  avatarFrame: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: colors.brandInk,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
  },
  online: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.brandGreen,
    borderWidth: 2,
    borderColor: colors.brandPaper,
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
    color: colors.brandInk,
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  time: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  preview: {
    color: colors.muted,
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
    backgroundColor: colors.brandInk,
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
    backgroundColor: colors.brandCoral,
    transform: [{ rotate: '20deg' }],
  },
  emptyTitle: {
    color: colors.brandInk,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 16,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    fontSize: 12,
  },
});
