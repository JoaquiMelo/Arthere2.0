import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { AppText, Button, IconButton, MediaImage, ScreenContainer } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

export type GalleryWork = { id: string; imageUrl: string; titulo?: string | null; descricao?: string | null };

export function PortfolioGallery({ works, onEdit }: { works: GalleryWork[]; onEdit?: (work: GalleryWork) => void }) {
  const { color, spacing, radius, typography } = useThemeTokens();
  const { width, fontScale } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = works.find((work) => work.id === selectedId);
  const compact = width < 340 || fontScale > 1.4;
  // Alterna uma obra de destaque com um díptico assimétrico, na ordem da API.
  const groups: GalleryWork[][] = [];
  for (let i = 0; i < works.length;) {
    const count = compact || i % 3 === 0 ? 1 : 2;
    groups.push(works.slice(i, i + count));
    i += count;
  }

  return (
    <View style={{ gap: spacing.xl }}>
      {groups.map((group, row) => (
        <View key={group[0].id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          {group.map((work, column) => {
            const solo = group.length === 1;
            const index = works.indexOf(work);
            const tall = !solo && (row + column) % 2 === 1;
            return (
              <Pressable key={work.id} accessibilityRole="button" accessibilityLabel={`Visualizar ${work.titulo || 'trabalho criativo'}`}
                onPress={() => setSelectedId(work.id)}
                style={({ pressed }) => ({ flex: solo ? 1 : tall ? 1 : 1.15, minWidth: 0, gap: spacing.xs, marginTop: !solo && !tall ? spacing.lg : 0, opacity: pressed ? 0.82 : 1 })}>
                <View style={{ padding: spacing.xs, borderWidth: 1, borderColor: color.border, borderRadius: radius.control, backgroundColor: color.surface }}>
                  <MediaImage uri={work.imageUrl} style={{ width: '100%', aspectRatio: solo ? 4 / 3 : tall ? 3 / 4 : 5 / 4, borderRadius: radius.xs }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
                  <AppText variant="label" color="accentText" weight="bold">{String(index + 1).padStart(2, '0')}</AppText>
                  <View style={{ flex: 1, minWidth: 0, gap: spacing.xxs }}>
                    <AppText variant={solo ? 'title' : 'bodySmall'} weight="bold">{work.titulo || 'Trabalho criativo'}</AppText>
                    {work.descricao ? <AppText variant="label" color="textSecondary" numberOfLines={2}>{work.descricao}</AppText> : null}
                  </View>
                  <Ionicons name="expand-outline" size={14} color={color.textSecondary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Modal visible={Boolean(selected)} animationType="none" onRequestClose={() => setSelectedId(null)}>
        <ScreenContainer accessibilityViewIsModal>
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
            <AppText variant="label" color="accentText" weight="bold" style={{ letterSpacing: typography.tracking.wide, flex: 1 }}>ARTHERE / GALERIA</AppText>
            <IconButton icon="close" accessibilityLabel="Fechar trabalho" variant="outline" onPress={() => setSelectedId(null)} />
          </View>
          {selected ? (
            <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] }}>
              <MediaImage uri={selected.imageUrl} resizeMode="contain" style={{ width: '100%', aspectRatio: 4 / 5, borderRadius: radius.control }} />
              <AppText variant="h2" weight="bold" accessibilityRole="header">{selected.titulo || 'Trabalho criativo'}</AppText>
              {selected.descricao ? <AppText color="textSecondary">{selected.descricao}</AppText> : null}
              {onEdit ? <Button variant="outline" style={{ borderRadius: radius.control }} onPress={() => { setSelectedId(null); onEdit(selected); }}>Editar este trabalho</Button> : null}
            </ScrollView>
          ) : null}
        </ScreenContainer>
      </Modal>
    </View>
  );
}
