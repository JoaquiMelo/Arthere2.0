const eventDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function isEventoConcluido(data: Date, now = new Date()): boolean {
  return eventDay.format(data) < eventDay.format(now);
}
