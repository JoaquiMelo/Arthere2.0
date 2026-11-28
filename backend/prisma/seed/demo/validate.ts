import { cities, specialties } from './catalog';
import { demo, type Plan } from './plan';
import { SeedError } from './safety';

export const amount = (plan: Plan) => ({
  usuarios: plan.users.length,
  agentes: plan.agents.length,
  contratantesEventos: plan.users.filter(({ tipo }) => tipo === 'CONTRATANTE_EVENTOS').length,
  contratantesOportunidades: plan.users.filter(({ tipo }) => tipo === 'CONTRATANTE_OPORTUNIDADES').length,
  portfolios: new Set(plan.works.map(({ agenteId }) => agenteId)).size,
  trabalhos: plan.works.length,
  eventos: plan.events.length,
  albuns: plan.albums.length,
  vagas: plan.jobs.length,
  solicitacoesEvento: plan.eventRequests.length,
  candidaturasVaga: plan.jobRequests.length,
  avaliacoes: plan.reviews.length,
  imagens: plan.art.length,
});

const timestamp = (value: unknown) => value instanceof Date ? value.getTime() : Date.parse(String(value));
const dateInBrazil = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' });
const timeInBrazil = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function validatePlan(plan: Plan) {
  const counts = amount(plan);
  const problems: string[] = [];
  const check = (condition: boolean, description: string) => { if (!condition) problems.push(description); };
  const roles = new Map(plan.users.map((user) => [user.id, user.tipo]));
  const contractors = new Map(plan.contractors.map((profile) => [profile.id, profile]));
  const agents = new Map(plan.agents.map((profile) => [profile.id, profile]));
  const jobs = new Map(plan.jobs.map((job) => [job.id, job]));
  const events = new Map(plan.events.map((event) => [event.id, event]));
  const imageUrls = new Set(plan.art.map((art) => `/uploads/${art.filename}`));
  const before = (start: unknown, end: unknown) => timestamp(start) < timestamp(end);
  const isPast = (date: unknown) => dateInBrazil.format(timestamp(date)) < plan.config.anchor;
  const unique = (keys: string[]) => new Set(keys).size === keys.length;

  check(counts.usuarios === 75 && counts.agentes === 50 && counts.contratantesEventos === 10 &&
    counts.contratantesOportunidades === 15 && counts.portfolios === 50 && counts.trabalhos === 150 &&
    counts.eventos === 30 && counts.vagas === 10 && counts.albuns === 10 &&
    counts.solicitacoesEvento === 120 && counts.candidaturasVaga === 40 && counts.avaliacoes > 0 &&
    counts.avaliacoes <= 250, 'Os volumes não correspondem ao plano.');
  check(unique(plan.users.map(({ email }) => email)) && plan.users.every(({ email }) => email.endsWith('@example.com')),
    'Contas duplicadas ou fora do domínio reservado.');
  check(unique([...plan.agents, ...plan.contractors].map(({ usuarioId }) => usuarioId))
    && plan.agents.every(({ usuarioId }) => roles.get(usuarioId) === 'AGENTE')
    && plan.contractors.every(({ usuarioId }) => ['CONTRATANTE_EVENTOS', 'CONTRATANTE_OPORTUNIDADES'].includes(roles.get(usuarioId) ?? '')),
  'Papéis ou vínculos de perfis inválidos.');
  const profileGroups = [
    plan.agents, plan.contractors.filter(({ usuarioId }) => roles.get(usuarioId) === 'CONTRATANTE_EVENTOS'),
    plan.contractors.filter(({ usuarioId }) => roles.get(usuarioId) === 'CONTRATANTE_OPORTUNIDADES'),
  ];
  check(cities.every(({ name, counts: quota }) => profileGroups.every((group, index) =>
    group.filter((profile) => profile.cidade === name && profile.estado === 'SP').length === quota[index])),
  'Distribuição geográfica inválida.');
  check(specialties.every(({ name, quota }) => plan.agents.filter(({ especialidade }) => especialidade === name).length === quota),
    'Distribuição de especialidades inválida.');
  const coordinateRows = [...plan.agents, ...plan.events];
  check(coordinateRows.every(({ cidade, latitude, longitude }) => {
    const city = cities.find(({ name }) => name === cidade);
    return typeof latitude === 'number' && typeof longitude === 'number' && Boolean(city?.points.some(([lat, lng]) =>
      Math.abs(latitude - lat) < 0.003 && Math.abs(longitude - lng) < 0.003));
  }) && unique(coordinateRows.map(({ latitude, longitude }) => `${latitude}:${longitude}`)),
  'Coordenadas fora dos pontos urbanos catalogados ou repetidas.');
  check(plan.agents.every((agent) => agent.visivelMapa && plan.works.filter((work) => work.agenteId === agent.id).length === 3)
    && plan.works.every((work) => agents.has(work.agenteId)), 'Cada agente precisa de três itens de portfólio.');
  check(imageUrls.size === plan.art.length && [...plan.agents, ...plan.contractors].every((profile) =>
    imageUrls.has(profile.avatarUrl!) && imageUrls.has(profile.bannerUrl!))
    && plan.works.every(({ imageUrl }) => imageUrls.has(imageUrl))
    && plan.events.every(({ imagemUrl }) => imageUrls.has(imagemUrl!)), 'Imagens duplicadas ou relações de mídia incompletas.');
  check([...plan.agents, ...plan.contractors].every(({ nome }) => nome.endsWith(demo))
    && [...plan.events, ...plan.jobs].every(({ titulo }) => titulo.endsWith(demo))
    && plan.works.every(({ titulo }) => titulo?.endsWith(demo)) && plan.reviews.every(({ comentario }) => comentario?.endsWith(demo)),
  'Há registros sem identificação demonstrativa.');
  check(new Set(plan.jobs.map(({ contratanteId }) => contratanteId)).size === 10
    && plan.jobs.every((job) => roles.get(contractors.get(job.contratanteId)?.usuarioId) === 'CONTRATANTE_OPORTUNIDADES'
      && before(job.criadoEm, job.dataEvento)), 'Dono ou data de oportunidade inválidos.');
  check(new Set(plan.events.map(({ cidade }) => cidade)).size === cities.length
    && profileGroups[1].every(({ id }) => plan.events.filter(({ contratanteId }) => contratanteId === id).length === 3)
    && plan.events.filter((event) => isPast(event.dataEvento)).length === 10
    && plan.events.filter((event) => dateInBrazil.format(timestamp(event.dataEvento)) === plan.config.anchor).length === 3
    && plan.events.filter(({ premium }) => premium).length === 5 && plan.events.filter(({ fixado }) => fixado).length === 4
    && plan.events.every((event) => roles.get(contractors.get(event.contratanteId ?? undefined)?.usuarioId) === 'CONTRATANTE_EVENTOS'
      && before(event.criadoEm, event.dataEvento) && timeInBrazil.format(timestamp(event.dataEvento)) === event.horario),
  'Cenários temporais, destaque, horário ou organização inválidos.');
  check(plan.albums.every(({ eventoId, fotos }) => events.has(eventoId) && isPast(events.get(eventoId)!.dataEvento)
    && Array.isArray(fotos) && fotos.length === 2 && fotos.every((url) => typeof url === 'string' && imageUrls.has(url))),
  'Álbum de evento inválido.');
  check(unique(plan.eventRequests.map((item) => `${item.eventoId}:${item.agenteId}`)) && plan.eventRequests.every((item) => {
    const event = events.get(item.eventoId);
    return agents.has(item.agenteId) && event !== undefined && before(event.criadoEm, item.criadoEm)
      && before(item.criadoEm, event.dataEvento) && !(isPast(event.dataEvento) && item.status === 'PENDENTE');
  }), 'Solicitações de eventos duplicadas, órfãs ou fora de ordem.');
  check(unique(plan.jobRequests.map((item) => `${item.projetoId}:${item.agenteId}`)) && plan.jobRequests.every((item) => {
    const job = jobs.get(item.projetoId);
    return agents.has(item.agenteId) && job !== undefined && before(job.criadoEm, item.criadoEm) && before(item.criadoEm, job.dataEvento)
      && (job.status === 'ABERTO' || item.status !== 'PENDENTE');
  }) && plan.jobs.every((job) => plan.jobRequests.filter((item) => item.projetoId === job.id && item.status === 'ACEITA').length <= 1),
  'Candidaturas de oportunidade incompatíveis com o histórico.');
  check(unique(plan.reviews.map((item) => `${item.agenteId}:${item.contratanteId}`)) && plan.reviews.every((review) => {
    const event = plan.eventRequests.find((item) => {
      const source = events.get(item.eventoId)!;
      return item.agenteId === review.agenteId && item.status === 'ACEITA' && source.contratanteId === review.contratanteId
        && isPast(source.dataEvento) && before(source.dataEvento, review.criadoEm);
    });
    const job = plan.jobRequests.find((item) => {
      const source = jobs.get(item.projetoId)!;
      return item.agenteId === review.agenteId && item.status === 'ACEITA' && source.contratanteId === review.contratanteId
        && source.status === 'CONCLUIDO' && before(source.dataEvento, review.criadoEm);
    });
    return Boolean(event || job) && Number.isInteger(review.nota) && review.nota >= 1 && review.nota <= 5;
  }), 'Avaliações sem uma colaboração concluída ou duplicadas.');
  check(plan.agents.every((agent) => {
    const reviews = plan.reviews.filter((review) => review.agenteId === agent.id);
    return agent.totalAvaliacoes === reviews.length
      && agent.notaMedia === (reviews.length ? reviews.reduce((sum, item) => sum + item.nota, 0) / reviews.length : 0)
      && agent.totalProjetos === plan.jobRequests.filter((item) => item.agenteId === agent.id && item.status === 'ACEITA').length;
  }), 'Agregados de reputação incoerentes.');

  if (problems.length) throw new SeedError(problems.join(' '));
  return counts;
}
