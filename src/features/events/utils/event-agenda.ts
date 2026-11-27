import type { Evento } from '../types/event';

type ApiEvent = Omit<Evento, 'data' | 'horario' | 'organizador' | 'imagemUrl' | 'destaque' | 'contratanteId'> & {
  dataEvento: string;
  horario?: string | null;
  organizador?: string | null;
  imagemUrl?: string | null;
  contratanteId?: string | null;
  fixado?: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const monthKey = (date: Date) => dateKey(date).slice(0, 7);
export const eventDate = (key: string) => new Date(`${key}T12:00:00`);
const eventZone = 'America/Sao_Paulo';
const eventDayFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: eventZone, year: 'numeric', month: '2-digit', day: '2-digit',
});
const eventClockFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: eventZone, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export const eventDayKey = (date = new Date()) => eventDayFormat.format(date);
export const isEventConcluded = (day: string, today = eventDayKey()) => Boolean(day) && day < today;

export function eventPoint(event?: Pick<Evento, 'latitude' | 'longitude'> | null) {
  const { latitude, longitude } = event ?? {};
  return typeof latitude === 'number' && Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

/** Converte a data e hora civil da agenda em um instante, independente do fuso do aparelho. */
export function eventInstant(day: string, time: string): Date | null {
  const wanted = `${day}T${time}`;
  const utc = new Date(`${wanted}:00Z`);
  if (!Number.isFinite(utc.getTime())) return null;
  const wallClock = (date: Date) => eventClockFormat.format(date).replace(' ', 'T');
  const observed = new Date(`${wallClock(utc)}:00Z`);
  const instant = new Date(utc.getTime() + (utc.getTime() - observed.getTime()));
  return wallClock(instant) === wanted ? instant : null;
}

export function mapEvento(item: ApiEvent): Evento {
  const date = new Date(item.dataEvento);
  return {
    id: item.id, titulo: item.titulo, categoria: item.categoria, descricao: item.descricao,
    local: item.local, cidade: item.cidade,
    latitude: item.latitude, longitude: item.longitude,
    data: Number.isFinite(date.getTime()) ? eventDayKey(date) : '',
    horario: item.horario ?? '', organizador: item.organizador ?? '',
    premium: Boolean(item.premium), destaque: Boolean(item.fixado),
    imagemUrl: item.imagemUrl ?? undefined, contratanteId: item.contratanteId ?? undefined,
  };
}

export function normalizeEventText(value?: string) {
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function filterEvents(events: Evento[], search: string, category: string | null, premiumOnly: boolean) {
  const terms = normalizeEventText(search).split(/\s+/).filter(Boolean);
  return events.filter((item) => {
    if (premiumOnly && !item.premium) return false;
    if (category !== null && normalizeEventText(item.categoria) !== category) return false;
    if (!terms.length) return true;
    const text = [item.titulo, item.categoria, item.descricao, item.local, item.cidade, item.organizador]
      .map(normalizeEventText).join(' ');
    return terms.every((term) => text.includes(term));
  });
}

export function sortEvents(events: Evento[], today: string) {
  return [...events].sort((a, b) => {
    const group = (item: Evento) => !item.data ? 2 : item.data >= today ? 0 : 1;
    const byGroup = group(a) - group(b);
    if (byGroup) return byGroup;
    const byDate = a.data.localeCompare(b.data);
    return (group(a) === 1 ? -byDate : byDate) || a.horario.localeCompare(b.horario) || a.titulo.localeCompare(b.titulo, 'pt-BR');
  });
}

const abbreviatedMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const writtenMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long' });

export const shortCalendarMonth = (date: Date) => abbreviatedMonth.format(date).replace('.', '');
export const calendarMonthName = (date: Date) => writtenMonth.format(date);
export const eventCountLabel = (count: number) => `${count} ${count === 1 ? 'evento' : 'eventos'}`;
export const shiftCalendarMonth = (month: Date, delta: number) =>
  new Date(month.getFullYear(), month.getMonth() + delta, 1, 12);

export function calendarWeeks(month: Date) {
  const year = month.getFullYear();
  const index = month.getMonth();
  const offset = (shiftCalendarMonth(month, 0).getDay() + 6) % 7;
  const monthLength = new Date(year, index + 1, 0, 12).getDate();
  return Array.from({ length: Math.ceil((offset + monthLength) / 7) }, (_, week) =>
    Array.from({ length: 7 }, (_, column) => dateKey(new Date(year, index, week * 7 + column - offset + 1, 12))),
  );
}

export function groupDatedEvents(events: Evento[], keyFor: (event: Evento) => string) {
  const groups = new Map<string, Evento[]>();
  for (const event of events) {
    const key = keyFor(event);
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }
  return groups;
}
