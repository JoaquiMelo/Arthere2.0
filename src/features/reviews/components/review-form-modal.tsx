import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, View, type Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, FilterChip, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { focusAccessibilityHeading } from '@/shared/focus-accessibility';

interface Props {
  visible: boolean;
  agenteNome: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (dados: { nota: number; comentario: string }) => Promise<void>;
}

export function ReviewFormModal({ visible, agenteNome, busy, onClose, onSubmit }: Props) {
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const titleRef = useRef<ComponentRef<typeof Text>>(null);
  const { color, dimensions, radius, spacing } = useThemeTokens();

  return (
    <Modal visible={visible} animationType="fade" transparent onShow={() => focusAccessibilityHeading(titleRef)}
      onRequestClose={() => { if (!busy) onClose(); }}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.overlay, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['left', 'right', 'bottom']} accessibilityViewIsModal
          style={{
            width: '100%', maxWidth: dimensions.contentMaxWidth, maxHeight: '85%', alignSelf: 'center',
            backgroundColor: color.surface, borderTopLeftRadius: radius.sheetCompact, borderTopRightRadius: radius.sheetCompact,
          }}>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <AppText ref={titleRef} variant="h3" weight="bold" accessibilityRole="header">Avaliar {agenteNome}</AppText>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="label" weight="semibold">Nota de 1 a 5</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <FilterChip key={value} label={String(value)} accessibilityLabel={`Nota ${value} de 5`}
                    selected={nota === value} disabled={busy} onPress={() => setNota(value)} />
                ))}
              </View>
            </View>
            <TextField label="Comentário (opcional)" value={comentario} onChangeText={setComentario}
              placeholder="Conte como foi a experiência" multiline textAlignVertical="top" editable={!busy} />
            <Button loading={busy} disabled={nota === null}
              onPress={() => {
                if (nota === null) return;
                Keyboard.dismiss();
                void onSubmit({ nota, comentario });
              }}>Enviar avaliação</Button>
            <Button variant="ghost" disabled={busy} onPress={onClose}>Cancelar</Button>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
