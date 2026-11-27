import { Pressable, View } from 'react-native';
import { AppText, IconButton } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { Evento } from '../types/event';
import { calendarMonthName, eventCountLabel, monthKey, shortCalendarMonth } from '../utils/event-agenda';

type Props = {
  year: number;
  selected: Date;
  eventsByMonth: ReadonlyMap<string, Evento[]> | null;
  onMove: (delta: number) => void;
  onChoose: (month: Date) => void;
};

export function CalendarYearGrid({ year, selected, eventsByMonth, onMove, onChoose }: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const backgrounds = [color.accentSecondary, color.accentSoft, color.surfaceSubtle, color.surface];
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
        <IconButton icon="chevron-back" variant="outline" accessibilityLabel="Ano anterior" onPress={() => onMove(-1)} />
        <AppText variant="h1" weight="heavy" accessibilityRole="header" accessibilityLiveRegion="polite">{year}</AppText>
        <IconButton icon="chevron-forward" variant="outline" accessibilityLabel="Próximo ano" onPress={() => onMove(1)} />
      </View>
      {Array.from({ length: 4 }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: spacing.sm }}>
          {Array.from({ length: 3 }, (_, column) => {
            const index = row * 3 + column;
            const month = new Date(year, index, 1, 12);
            const key = monthKey(month);
            const active = key === monthKey(selected);
            const countLabel = eventsByMonth ? eventCountLabel(eventsByMonth.get(key)?.length ?? 0) : undefined;
            const background = active ? color.accent : backgrounds[index % backgrounds.length];
            const ink = active ? 'onAccent' : index % backgrounds.length === 0 ? 'onAccentSecondary' : 'textPrimary';
            return (
              <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={[`${calendarMonthName(month)} de ${year}`, countLabel].filter(Boolean).join('. ')}
                onPress={() => onChoose(month)} style={({ pressed }) => ({
                  flex: 1, minWidth: 0, minHeight: dimensions.control.large + spacing['2xl'], overflow: 'hidden',
                  borderRadius: radius.cardCompact, backgroundColor: background, opacity: pressed ? 0.78 : 1,
                  borderWidth: 1, borderColor: active ? color.onAccent : color.border,
                  paddingHorizontal: spacing.sm, paddingVertical: spacing.md, gap: spacing.xs,
                })}>
                <View pointerEvents="none" style={{ position: 'absolute', bottom: -spacing.lg, right: -spacing.lg,
                  width: dimensions.control.large, height: dimensions.control.large, borderRadius: radius.pill,
                  backgroundColor: color[ink], opacity: 0.08 }} />
                <AppText variant="h3" weight="heavy" color={ink} style={{ textTransform: 'capitalize' }}>
                  {shortCalendarMonth(month)}
                </AppText>
                {countLabel ? <AppText variant="caption" color={ink}>{countLabel}</AppText> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
