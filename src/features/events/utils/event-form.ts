import { dateKey, eventDate, eventDayKey, eventInstant, mapEvento } from './event-agenda';

export type EventData = Parameters<typeof mapEvento>[0] & {
  contratante?: { id: string; nome?: string; empresa?: string } | null;
};

export type EventForm = {
  titulo: string; categoria: string; descricao: string; local: string; cidade: string;
  data: string; horario: string; organizador: string; imagem: string; premium: boolean; fixado: boolean;
};

export const categories = ['Cultura', 'Artes Visuais', 'Música', 'Fotografia', 'Literatura', 'Moda', 'Design', 'Dança', 'Teatro', 'Gastronomia'];

export function newEventForm(organizador = ''): EventForm {
  return {
    titulo: '', categoria: 'Cultura', descricao: '', local: '', cidade: '', data: '', horario: '',
    organizador, imagem: '', premium: false, fixado: false,
  };
}

export function formFromEvent(item: EventData): EventForm {
  const event = mapEvento(item);
  return {
    titulo: event.titulo, categoria: event.categoria, descricao: event.descricao, local: event.local,
    cidade: event.cidade, data: event.data.split('-').reverse().join('/'), horario: event.horario,
    organizador: event.organizador, imagem: event.imagemUrl ?? '', premium: event.premium, fixado: Boolean(event.destaque),
  };
}

export function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

export function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return [digits.slice(0, 2), digits.slice(2)].filter(Boolean).join(':');
}

export function validateEvent(form: EventForm, original?: EventForm, today = eventDayKey()) {
  const errors: Partial<Record<keyof EventForm, string>> = {};
  for (const field of ['titulo', 'categoria', 'descricao', 'local', 'cidade'] as const) {
    if (!form[field].trim()) errors[field] = 'Campo obrigatório.';
  }
  const data = form.data.trim();
  const horario = form.horario.trim();
  const dateChanged = !original || data !== original.data || horario !== original.horario.trim();
  const key = data.split('/').reverse().join('-');
  const civil = eventDate(key);
  const validDate = /^\d{2}\/\d{2}\/[1-9]\d{3}$/.test(data) && Number.isFinite(civil.getTime()) && dateKey(civil) === key;
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
  if (!original || dateChanged) {
    if (!validDate) errors.data = 'Informe uma data válida no formato DD/MM/AAAA.';
    else if (!original && key < today) errors.data = 'Escolha hoje ou uma data futura.';
    if (!horario && !original) errors.horario = 'Informe o horário do evento.';
    else if (horario && !validTime) errors.horario = 'Informe um horário válido no formato HH:MM.';
  }
  if (!original && !form.organizador.trim()) errors.organizador = 'Informe quem organiza o evento.';
  const scheduled = validDate && (validTime || !horario) ? eventInstant(key, horario || '00:00') : null;
  if (dateChanged && validDate && !errors.data && !errors.horario && !scheduled) {
    errors.horario = 'Este horário não está disponível nessa data.';
  }
  return {
    errors,
    payload: {
      titulo: form.titulo.trim(), categoria: form.categoria.trim(), descricao: form.descricao.trim(),
      local: form.local.trim(), cidade: form.cidade.trim(), organizador: form.organizador.trim() || null,
      premium: form.premium, fixado: form.fixado,
      ...(dateChanged && scheduled ? { dataEvento: scheduled.toISOString(), horario: horario || null } : {}),
    },
  };
}
