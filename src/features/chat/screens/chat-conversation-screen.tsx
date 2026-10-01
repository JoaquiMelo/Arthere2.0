import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import {
  FlatList,
  Image,
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
import { colors } from '@/shared/theme/colors';

export default function ChatConversationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversations, sendMessage } = useChat();
  const [draft, setDraft] = useState('');
  const conversation = conversations.find(
    (item) => item.id === route.params?.conversationId,
  );

  if (!conversation) return null;

  const submit = () => {
    sendMessage(conversation.id, draft);
    setDraft('');
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
            <Ionicons name="arrow-back" size={20} color={colors.brandInk} />
          </TouchableOpacity>
          <View style={styles.avatarFrame}>
            <Image source={{ uri: conversation.participant.avatarUrl }} style={styles.avatar} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.kicker}>CONVERSA</Text>
            <Text style={styles.name}>{conversation.participant.nome}</Text>
            <Text style={styles.status}>
              {conversation.participant.disponivel ? 'Disponível agora' : 'Offline'}
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
            placeholderTextColor={colors.muted}
            multiline
          />
          <TouchableOpacity
            style={[styles.send, !draft.trim() && styles.sendDisabled]}
            onPress={submit}
            disabled={!draft.trim()}
            accessibilityLabel="Enviar mensagem"
          >
            <Ionicons name="arrow-up" size={19} color={colors.brandPaper} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPaper,
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
    backgroundColor: colors.brandPaper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: 36,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  avatarFrame: {
    width: 42,
    height: 42,
    marginLeft: 9,
    borderWidth: 1,
    borderColor: colors.brandInk,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  kicker: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  name: {
    color: colors.brandInk,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  status: {
    color: colors.brandGreen,
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
    color: colors.muted,
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
    backgroundColor: colors.brandInk,
    borderColor: colors.brandInk,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  receivedLabel: {
    color: colors.brandCoral,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  message: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  sentText: {
    color: colors.brandPaper,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.brandPaper,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  send: {
    width: 42,
    height: 42,
    backgroundColor: colors.brandCoral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
