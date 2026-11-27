import { Ionicons } from '@expo/vector-icons';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { AppText, Badge, MediaImage } from '@/shared/components';
import { realImageUri } from '@/shared/config/image-uri';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { Evento } from '../types/event';
import { eventDate } from '../utils/event-agenda';

const weekdayFormat = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });

export function CalendarEventRow({ event, archived, albumCover, onPress }: {
  event: Evento;
  archived: boolean;
  albumCover?: string;
  onPress: () => void;
}) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const { width, fontScale } = useWindowDimensions();
  const compact = width / fontScale < 310;
  const date = event.data ? eventDate(event.data) : null;
  const cover = realImageUri(albumCover) || realImageUri(event.imagemUrl);
  const when = date ? dateFormat.format(date) : 'Data a confirmar';
  const label = [event.titulo, when, event.horario, event.cidade, event.premium && 'Premium',
    event.destaque && 'Destaque', archived && 'Evento concluído'].filter(Boolean).join('. ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityHint={archived ? 'Abre as fotos e os detalhes do evento concluído' : 'Abre os detalhes do evento'}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: color.surface, borderColor: color.border, borderWidth: 1,
        borderRadius: radius.cardCompact, opacity: pressed ? 0.78 : 1, padding: spacing.sm,
        flexDirection: compact ? 'column' : 'row', gap: spacing.sm, alignItems: compact ? 'stretch' : 'flex-start',
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        {date ? <View style={{
          minWidth: dimensions.control.medium, alignItems: 'center', paddingHorizontal: spacing.xs, paddingVertical: spacing.sm,
          backgroundColor: event.destaque ? color.accent : color.accentSoft, borderRadius: radius.sm,
        }}>
          <AppText variant="caption" weight="bold" color={event.destaque ? 'onAccent' : 'accentText'} style={{ textTransform: 'uppercase' }}>
            {weekdayFormat.format(date).replace('.', '')}
          </AppText>
          <AppText variant="h2" weight="heavy" color={event.destaque ? 'onAccent' : 'accentText'} style={{ fontVariant: ['tabular-nums'] }}>
            {String(date.getDate()).padStart(2, '0')}
          </AppText>
        </View> : null}
        <MediaImage uri={cover} icon="calendar-outline" iconSize={dimensions.icon.medium} style={{
          ...(compact ? { flex: 1 } : { width: dimensions.control.large + spacing.sm }),
          height: dimensions.control.large + spacing.lg, borderRadius: radius.sm,
        }} />
      </View>
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xs }}>
        <AppText weight="bold">{event.titulo}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {event.categoria ? <Badge label={event.categoria} /> : null}
          {event.destaque ? <Badge label="Destaque" tone="accent" icon="pin-outline" /> : null}
          {event.premium ? <Badge label="Premium" tone="warning" icon="star-outline" /> : null}
        </View>
        {event.horario || event.cidade || !date ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name={event.horario ? 'time-outline' : 'location-outline'} size={dimensions.icon.small} color={color.textSecondary} />
            <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
              {[event.horario, event.cidade, !date && when].filter(Boolean).join(' · ')}
            </AppText>
          </View>
        ) : null}
        {archived ? <AppText variant="caption" color="accentText" weight="bold">Ver fotos e detalhes</AppText> : null}
      </View>
    </Pressable>
  );
}
