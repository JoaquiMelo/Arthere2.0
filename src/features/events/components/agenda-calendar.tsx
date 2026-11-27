import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import { AppText, Button, IconButton } from '@/shared/components';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { Evento } from '../types/event';
import {
  calendarMonthName, calendarWeeks, eventCountLabel, eventDate, monthKey, shortCalendarMonth,
} from '../utils/event-agenda';

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });

type Props = {
  month: Date;
  today: string;
  selected: string | null;
  eventsByDay: ReadonlyMap<string, Evento[]>;
  onMove: (delta: number) => void;
  onSelect: (key: string) => void;
  onToday: () => void;
};

export function AgendaCalendar({ month, today, selected, eventsByDay, onMove, onSelect, onToday }: Props) {
  const { color, dimensions, motion, radius, spacing, typography } = useThemeTokens();
  const reducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const key = monthKey(month);
  const monthName = `${calendarMonthName(month)} de ${month.getFullYear()}`;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.78);
    const animation = Animated.timing(opacity, {
      toValue: 1, duration: motion.duration.standard, useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [key, motion.duration.standard, opacity, reducedMotion]);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm }}>
        <IconButton icon="chevron-back" variant="outline" accessibilityLabel="Mês anterior" onPress={() => onMove(-1)} />
        <View accessible accessibilityRole="header" accessibilityLabel={monthName} accessibilityLiveRegion="polite"
          style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
          <AppText variant="display" weight="black" style={{
            fontSize: typography.size.display + spacing.md, lineHeight: typography.lineHeight.display + spacing.md,
            textTransform: 'uppercase', letterSpacing: typography.tracking.tight, textAlign: 'center',
          }}>{shortCalendarMonth(month)}</AppText>
          <AppText variant="title" weight="semibold" color="textSecondary">{month.getFullYear()}</AppText>
        </View>
        <IconButton icon="chevron-forward" variant="outline" accessibilityLabel="Próximo mês" onPress={() => onMove(1)} />
      </View>

      <Animated.View style={{ opacity, borderRadius: radius.card, backgroundColor: color.surface, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', paddingVertical: spacing.sm, backgroundColor: color.surfaceSubtle }}>
          {weekdays.map((label, column) => (
            <AppText key={label} variant="caption" weight="bold" color={column >= 5 ? 'warningText' : 'textPrimary'}
              accessible={false} style={{ flex: 1, textAlign: 'center' }}>{label}</AppText>
          ))}
        </View>
        {calendarWeeks(month).map((week) => (
          <View key={week[0]} style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: color.border }}>
            {week.map((date, column) => {
              const inMonth = date.startsWith(key);
              const events = inMonth ? eventsByDay.get(date) ?? [] : [];
              const count = events.length;
              const featured = events.some(({ destaque }) => destaque);
              const premium = events.some((event) => event.premium);
              const active = date === selected;
              const current = date === today;
              const fill = active ? color.accent : count ? color.accentSoft : 'transparent';
              const ink = active ? 'onAccent' : !inMonth ? 'textSecondary' : 'textPrimary';
              const description = [fullDate.format(eventDate(date)), current && 'Hoje',
                inMonth && eventCountLabel(count), featured && 'Destaque', premium && 'Premium',
                !inMonth && 'Outro mês'].filter(Boolean).join('. ');

              return (
                <Pressable key={date} accessibilityRole="button" accessibilityLabel={description}
                  accessibilityState={{ selected: active }} onPress={() => onSelect(date)}
                  style={({ pressed }) => ({
                    flex: 1, minWidth: 0, minHeight: dimensions.touchTarget + spacing.xs,
                    alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs,
                    backgroundColor: column >= 5 ? color.surfaceSubtle : color.surface, opacity: pressed ? 0.75 : 1,
                  })}>
                  <View style={{ minWidth: dimensions.icon.extraLarge, maxWidth: '100%', borderRadius: radius.cardCompact,
                    alignItems: 'center', paddingHorizontal: spacing.xxs, paddingVertical: spacing.xxs, backgroundColor: fill,
                    borderWidth: spacing.xxs, borderColor: current ? (active ? color.onAccent : color.accentText) : 'transparent' }}>
                    <AppText variant="title" weight={active || count || current ? 'bold' : 'medium'} color={ink}
                      numberOfLines={1} adjustsFontSizeToFit
                      style={{ fontVariant: ['tabular-nums'], textDecorationLine: current ? 'underline' : 'none' }}>
                      {Number(date.slice(-2))}
                    </AppText>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                    gap: spacing.xxs, minHeight: dimensions.icon.small }}>
                    {count > 1 ? <AppText variant="caption" weight="bold" color="accentText">{count}</AppText> : null}
                    {count === 1 && !featured && !premium ? <View style={{
                      width: spacing.xs, height: spacing.xs, borderRadius: radius.pill, backgroundColor: color.accentText,
                    }} /> : null}
                    {featured ? <Ionicons name="pin" size={typography.size.caption} color={color.accentText} /> : null}
                    {premium ? <Ionicons name="star" size={typography.size.caption} color={color.warningText} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Animated.View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="pin" size={dimensions.icon.small} color={color.accentText} />
          <AppText variant="caption" color="textSecondary">Destaque</AppText>
          <Ionicons name="star" size={dimensions.icon.small} color={color.warningText} />
          <AppText variant="caption" color="textSecondary">Premium</AppText>
        </View>
        <Button variant="ghost" size="small" onPress={onToday}>Ir para hoje</Button>
      </View>
    </View>
  );
}
