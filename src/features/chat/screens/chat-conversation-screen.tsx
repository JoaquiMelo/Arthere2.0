import { Avatar } from '@/shared/components/media-image';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useChat } from '@/providers/chat-provider';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { AppText, FeedbackState, IconButton, ScreenContainer, ScreenHeader } from '@/shared/components';
import { useStatusAnnouncement } from '@/shared/hooks/use-status-announcement';
import type { ThemeTokens } from '@/shared/theme/tokens';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

export default function ChatConversationScreen() {
  const { params: { conversationId } } = useRoute<RouteProp<RootStackParamList, 'ChatConversation'>>();
  return <ChatConversation key={conversationId} id={conversationId} />;
}

function ChatConversation({ id }: { id: string }) {
  const { color } = useThemeTokens();
  const styles = useMemo(() => createStyles(color), [color]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { conversations, sendMessage, carregarMensagens } = useChat();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [history, setHistory] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const pending = useRef(false);
  const conversation = conversations.find((item) => item.id === id);
  useStatusAnnouncement(sendError);

  useEffect(() => {
    let active = true;
    void carregarMensagens(id).then(() => {
      if (active) setHistory('ready');
    }).catch(() => {
      if (active) setHistory('error');
    });
    return () => { active = false; };
  }, [id, carregarMensagens, retry]);

  const reload = () => {
    setHistory('loading');
    setRetry((version) => version + 1);
  };
  if (!conversation) return (
    <ScreenContainer>
      <ScreenHeader title="Conversa" onBack={() => navigation.goBack()} />
      {history === 'loading' ? <FeedbackState kind="loading" title="Carregando conversa…" /> :
        <FeedbackState kind="error" title="Conversa indisponível" description="Volte à lista de conversas e tente novamente." />}
    </ScreenContainer>
  );

  const submit = async () => {
    const texto = draft.trim();
    if (!texto || pending.current || history === 'loading') return;
    pending.current = true;
    setSending(true);
    setSendError('');
    try {
      await sendMessage(conversation.id, texto);
      setDraft((current) => current.trim() === texto ? '' : current);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Não foi possível enviar. Tente novamente.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-back" variant="outline" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} />
          <View style={styles.avatarFrame}>
            <Avatar uri={conversation.participant.avatarUrl} style={styles.avatar} iconSize={24} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.kicker}>CONVERSA</Text>
            <Text accessibilityRole="header" style={styles.name}>{conversation.participant.nome}</Text>
            <Text style={styles.status}>
              {conversation.participant.disponivel === true ? 'Disponível agora' : conversation.participant.disponivel === false ? 'Indisponível no momento' : 'Disponibilidade não informada'}
            </Text>
          </View>
        </View>
        {history === 'error' ? <FeedbackState kind="error" title="Não foi possível carregar as mensagens" onRetry={sending ? undefined : reload} /> : null}

        <FlatList
          data={conversation.messages}
          keyExtractor={(item) => item.id}
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            conversation.messages.length ? styles.messages : styles.empty
          }
          ListEmptyComponent={
            history === 'loading' ? <FeedbackState kind="loading" title="Carregando mensagens…" /> :
            history === 'error' ? undefined : <Text style={styles.emptyText}>
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

        {sendError ? <AppText variant="bodySmall" color="dangerText" accessibilityLiveRegion="polite" style={styles.sendError}>{sendError}</AppText> : null}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(value) => { setDraft(value); setSendError(''); }}
            placeholder="Escreva uma mensagem"
            accessibilityLabel="Mensagem"
            placeholderTextColor={color.textSecondary}
            multiline
          />
          <IconButton icon="arrow-up" variant="primary" loading={sending} onPress={() => void submit()}
            disabled={!draft.trim() || history === 'loading'}
            accessibilityLabel={sending ? 'Enviando mensagem' : 'Enviar mensagem'} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (color: ThemeTokens['color']) => StyleSheet.create({
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
  sendError: { paddingHorizontal: 14, paddingVertical: 8 },
});
