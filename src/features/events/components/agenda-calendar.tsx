import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { AppText, Button, IconButton } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { Evento } from '../types/event';
import { calendarWeeks, eventDate, monthKey } from '../utils/event-agenda';

const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
  const { color, dimensions, radius, spacing, typography } = useThemeTokens();
  const key = monthKey(month);
  const year = month.getFullYear();
  const name = monthName.format(month);
  const cellHeight = dimensions.control.large + spacing.xl;

  return (
    <View style={{ backgroundColor: color.surface, borderRadius: radius.card, borderWidth: 1, borderColor: color.border, overflow: 'hidden' }}>
      <View style={{ backgroundColor: color.accentSoft, padding: spacing.lg, gap: spacing.xs, borderTopWidth: spacing.xs, borderTopColor: color.accent }}>
        <AppText variant="title" weight="bold" accessibilityRole="header" accessibilityLabel={`${name} de ${year}`}
          accessibilityLiveRegion="polite"
          style={{ textTransform: 'capitalize' }}>
          {name}
        </AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
          <AppText variant="title" weight="bold" accessible={false} style={{ fontVariant: ['tabular-nums'] }}>{year}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <IconButton icon="chevron-back" variant="outline" accessibilityLabel="Mês anterior" onPress={() => onMove(-1)} />
            <IconButton icon="chevron-forward" variant="outline" accessibilityLabel="Próximo mês" onPress={() => onMove(1)} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: color.surfaceSubtle, paddingVertical: spacing.sm }}>
        {weekdays.map((weekday) => (
          <AppText key={weekday} variant="caption" color="textSecondary" accessible={false}
            style={{ flex: 1, textAlign: 'center' }}>
            {weekday}
          </AppText>
        ))}
      </View>
      {calendarWeeks(month).map((week, index) => (
        <View key={index} style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: color.border }}>
          {week.map((day, column) => {
            const divider = { flex: 1, minWidth: 0, borderRightWidth: column < 6 ? 1 : 0, borderColor: color.border };
            if (day === null) return <View key={column} style={[divider, { backgroundColor: color.surfaceSubtle }]} />;

            const civilDate = `${key}-${String(day).padStart(2, '0')}`;
            const events = eventsByDay.get(civilDate) ?? [];
            const feature = events.find((event) => event.destaque);
            const lead = feature ?? events[0];
            const active = selected === civilDate;
            const isToday = today === civilDate;
            const count = events.length;
            const foreground = active ? 'onAccent' : feature ? 'onAccentSecondary' : 'textPrimary';
            const label = [
              fullDate.format(eventDate(civilDate)),
              isToday ? 'Hoje' : '',
              `${count} ${count === 1 ? 'evento' : 'eventos'}`,
              lead?.titulo,
            ].filter(Boolean).join('. ');

            return (
              <Pressable key={column} accessibilityRole="button" accessibilityState={{ selected: active }}
                accessibilityLabel={label} onPress={() => onSelect(civilDate)}
                style={({ pressed }) => ({
                  ...divider,
                  minHeight: cellHeight,
                  borderTopWidth: spacing.xxs,
                  borderTopColor: active ? color.onAccent : feature ? color.onAccentSecondary : lead ? color.accentText : 'transparent',
                  backgroundColor: active ? color.accent : feature ? color.accentSecondary : lead ? color.surfaceSubtle : color.surface,
                  opacity: pressed ? 0.72 : 1,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: spacing.xs,
                  gap: spacing.xxs,
                })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xxs }}>
                  <AppText variant="label" weight={count || active || isToday ? 'bold' : 'regular'}
                    color={!active && !feature && isToday ? 'accentText' : foreground}
                    style={{ fontVariant: ['tabular-nums'], textDecorationLine: isToday ? 'underline' : 'none' }}>
                    {day}
                  </AppText>
                  {feature ? <Ionicons name="pin" size={typography.size.caption} color={color[foreground]} /> : null}
                </View>
                {lead ? (
                  <>
                    <AppText variant="caption" weight="semibold" color={foreground} numberOfLines={2}>{lead.titulo}</AppText>
                    {count > 1 ? <AppText variant="caption" weight="bold" color={foreground}>+{count - 1}</AppText> : null}
                  </>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, borderTopWidth: 1, borderColor: color.border, gap: spacing.xs,
      }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ width: spacing.md, height: spacing.xxs, backgroundColor: color.accentText }} />
            <AppText variant="caption" color="textSecondary">Evento</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="pin" size={typography.size.label} color={color.textSecondary} />
            <AppText variant="caption" color="textSecondary">Destaque</AppText>
          </View>
        </View>
        <Button variant="ghost" size="small" onPress={onToday}>Ir para hoje</Button>
      </View>
    </View>
  );
}
