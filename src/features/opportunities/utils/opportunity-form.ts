import type { Projeto } from '@/services/api';

export type OpportunityForm = {
  titulo: string;
  categoria: string;
  descricao: string;
  orcamento: string;
  data: string;
};

export const emptyOpportunityForm: OpportunityForm = {
  titulo: '', categoria: '', descricao: '', orcamento: '', data: '',
};

export const opportunityStatusLabels: Record<string, string> = {
  ABERTO: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluída',
  CANCELADO: 'Cancelada',
};

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
});
const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function opportunityDateLabel(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

export function opportunityBudgetLabel(value: number | null) {
  return value == null ? 'Valor a combinar' : currencyFormat.format(value);
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

export function formFromOpportunity(item: Projeto): OpportunityForm {
  return {
    titulo: item.titulo,
    categoria: item.categoria,
    descricao: item.descricao,
    orcamento: item.orcamento == null ? '' : String(item.orcamento).replace('.', ','),
    data: opportunityDateLabel(item.dataEvento),
  };
}

export function validateOpportunityForm(form: OpportunityForm, previousDate = '') {
  const titulo = form.titulo.trim();
  const categoria = form.categoria.trim();
  const descricao = form.descricao.trim();
  const rawAmount = form.orcamento.trim();
  const orcamento = rawAmount ? Number(rawAmount.replace(',', '.')) : null;
  const dateInput = form.data.trim();
  const dateChanged = dateInput !== previousDate;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateInput);
  let dataEvento: string | null = null;
  if (match && Number(match[3]) >= 1000) {
    const [, day, month, year] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
    if (opportunityDateLabel(date.toISOString()) === dateInput) dataEvento = date.toISOString();
  }
  const errors: Partial<Record<keyof OpportunityForm, string>> = {};
  if (!titulo) errors.titulo = 'Informe o título.';
  if (!categoria) errors.categoria = 'Informe a categoria.';
  if (!descricao) errors.descricao = 'Descreva o trabalho.';
  if (rawAmount && (!/^\d+([,.]\d{1,2})?$/.test(rawAmount) || !Number.isFinite(orcamento))) {
    errors.orcamento = 'Informe um valor válido, sem separador de milhar.';
  }
  if (dateChanged && dateInput && !dataEvento) errors.data = 'Informe uma data válida no formato DD/MM/AAAA.';
  return {
    errors,
    payload: { titulo, categoria, descricao, orcamento, ...(dateChanged ? { dataEvento } : {}) },
  };
}
