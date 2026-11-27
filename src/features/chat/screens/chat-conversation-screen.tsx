import { Avatar } from '@/shared/components/media-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useChat } from '@/providers/chat-provider';
import type { ThemeTokens } from '@/shared/theme/tokens';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

export default function ChatConversationScreen() {
  const { color } = useThemeTokens();
  const styles = useMemo(() => createStyles(color), [color]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversations, sendMessage, carregarMensagens } = useChat();
  const [draft, setDraft] = useState('');
  const conversation = conversations.find((item) => item.id === route.params?.conversationId);

  useEffect(() => {
    if (route.params?.conversationId) void carregarMensagens(route.params.conversationId);
  }, [route.params?.conversationId, carregarMensagens]);

  if (!conversation) return null;

  const submit = async () => {
    const texto = draft.trim();
    if (!texto) return;
    try {
      await sendMessage(conversation.id, texto);
      setDraft('');
    } catch (error) {
      Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color={color.textPrimary} />
          </TouchableOpacity>
          <View style={styles.avatarFrame}>
            <Avatar uri={conversation.participant.avatarUrl} style={styles.avatar} iconSize={24} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.kicker}>CONVERSA</Text>
            <Text style={styles.name}>{conversation.participant.nome}</Text>
            <Text style={styles.status}>
              {conversation.participant.disponivel === true ? 'Disponível agora' : conversation.participant.disponivel === false ? 'Indisponível no momento' : 'Disponibilidade não informada'}
            </Text>
          </View>
        </View>

        <FlatList
          data={conversation.messages}
          keyExtractor={(item) => item.id}
          style={styles.flex}
          contentContainerStyle={
            conversation.messages.length ? styles.messages : styles.empty
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Envie uma mensagem para iniciar a conversa com {conversation.participant.nome}.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sentByMe ? styles.sent : styles.received,
              ]}
            >
              {!item.sentByMe ? <Text style={styles.receivedLabel}>ARTHERE</Text> : null}
              <Text style={[styles.message, item.sentByMe && styles.sentText]}>
                {item.text}
              </Text>
            </View>
          )}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escreva uma mensagem"
            placeholderTextColor={color.textSecondary}
            multiline
          />
          <TouchableOpacity
            style={[styles.send, !draft.trim() && styles.sendDisabled]}
            onPress={submit}
            disabled={!draft.trim()}
            accessibilityLabel="Enviar mensagem"
          >
            <Ionicons name="arrow-up" size={19} color={color.onAccent} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (color: ThemeTokens['color']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.background,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  back: {
    width: 36,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  avatarFrame: {
    width: 42,
    height: 42,
    marginLeft: 9,
    borderWidth: 1,
    borderColor: color.textPrimary,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
  },
  avatarInitials: {
    color: color.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  kicker: {
    color: color.accentText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  name: {
    color: color.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  status: {
    color: color.successText,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  messages: {
    padding: 16,
    gap: 9,
    justifyContent: 'flex-end',
    flexGrow: 1,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 34,
  },
  emptyText: {
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: color.brandInk,
    borderColor: color.border,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: color.surface,
    borderColor: color.border,
  },
  receivedLabel: {
    color: color.accentText,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  message: {
    color: color.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  sentText: {
    color: color.textInverse,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: color.background,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    color: color.textPrimary,
    fontSize: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  send: {
    width: 42,
    height: 42,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
