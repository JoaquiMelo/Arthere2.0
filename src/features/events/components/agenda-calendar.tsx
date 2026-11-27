import { Pressable, View } from 'react-native';
import { AppText, Button, IconButton } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { calendarWeeks, eventDate, monthKey } from '../utils/event-agenda';

const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type Props = {
  month: Date;
  today: string;
  selected: string | null;
  counts: ReadonlyMap<string, number>;
  onMove: (delta: number) => void;
  onSelect: (key: string) => void;
  onToday: () => void;
};

export function AgendaCalendar({ month, today, selected, counts, onMove, onSelect, onToday }: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const key = monthKey(month);
  return (
    <View style={{ backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.border, paddingVertical: spacing.sm }}>
      <View style={{ paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <IconButton icon="chevron-back" variant="ghost" accessibilityLabel="Mês anterior" onPress={() => onMove(-1)} />
        <AppText variant="title" weight="bold" accessibilityRole="header" accessibilityLiveRegion="polite"
          style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
          {monthTitle.format(month)}
        </AppText>
        <IconButton icon="chevron-forward" variant="ghost" accessibilityLabel="Próximo mês" onPress={() => onMove(1)} />
      </View>
      <View style={{ flexDirection: 'row', paddingVertical: spacing.sm }}>
        {weekdays.map((weekday) => (
          <AppText key={weekday} variant="caption" color="textSecondary" style={{ flex: 1, textAlign: 'center' }} accessible={false}>
            {weekday}
          </AppText>
        ))}
      </View>
      {calendarWeeks(month).map((week, index) => (
        <View key={index} style={{ flexDirection: 'row' }}>
          {week.map((day, column) => {
            if (day === null) return <View key={column} style={{ flex: 1 }} />;
            const civilDate = `${key}-${String(day).padStart(2, '0')}`;
            const count = counts.get(civilDate) ?? 0;
            const active = selected === civilDate;
            const isToday = today === civilDate;
            return (
              <Pressable key={column} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={`${fullDate.format(eventDate(civilDate))}${isToday ? ', hoje' : ''}. ${count} ${count === 1 ? 'evento' : 'eventos'}`}
                onPress={() => onSelect(civilDate)}
                style={({ pressed }) => ({
                  flex: 1, minHeight: dimensions.touchTarget, alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1, paddingVertical: spacing.xxs,
                })}>
                <View style={{
                  minWidth: '85%', alignItems: 'center', justifyContent: 'center', gap: spacing.xxs,
                  paddingVertical: spacing.xs, borderRadius: radius.control, borderWidth: 1,
                  borderColor: isToday && !active ? color.accentText : 'transparent',
                  backgroundColor: active ? color.accent : 'transparent',
                }}>
                  <AppText variant="label" weight={count || active || isToday ? 'bold' : 'regular'} color={active ? 'onAccent' : 'textPrimary'}>
                    {day}
                  </AppText>
                  <View style={{ width: spacing.xs, height: spacing.xs, borderRadius: radius.pill, backgroundColor: count ? (active ? color.onAccent : color.accentText) : 'transparent' }} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={{ paddingHorizontal: spacing.md, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: spacing.xs, height: spacing.xs, borderRadius: radius.pill, backgroundColor: color.accentText }} />
          <AppText variant="caption" color="textSecondary">Dia com evento</AppText>
        </View>
        <Button variant="ghost" size="small" onPress={onToday}>Ir para hoje</Button>
      </View>
    </View>
  );
}
