import { createHash } from 'node:crypto';
import { Faker, en, pt_BR } from '@faker-js/faker';
import type { Prisma, TipoUsuario } from '../../../src/generated/prisma/client';
import { cities, eventFormats, opportunityBriefs, organizations, specialties, subjects, type City, type Specialty } from './catalog';

export type SeedConfig = { batch: string; seed: number; anchor: string };
export type Artwork = { filename: string; owner: string; category: string; kind: 'avatar' | 'banner' | 'work' | 'event' | 'album' };
type User = Omit<Prisma.UsuarioCreateManyInput, 'senha'>;
export const demo = ' · Demonstração';
const dayMs = 86_400_000;
const cityDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' });
export const todayInBrazil = () => cityDay.format(new Date());

export function stableId(config: Pick<SeedConfig, 'batch' | 'seed'>, key: string) {
  const bytes = createHash('sha256').update(`arthere-demo-v1:${config.batch}:${config.seed}:${key}`).digest();
  bytes[6] = (bytes[6] & 15) | 128;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.subarray(0, 16).toString('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

export function pointInCity(city: City, index: number) {
  const [latitude, longitude] = city.points[index % city.points.length];
  const shift = 0.00006 * (1 + Math.floor(index / city.points.length));
  return { latitude: Number((latitude + shift).toFixed(6)), longitude: Number((longitude - shift).toFixed(6)) };
}

export function makePlan(config: SeedConfig) {
  const faker = new Faker({ locale: [pt_BR, en], seed: config.seed });
  const subject = () => faker.helpers.arrayElement(subjects);
  const id = (key: string) => stableId(config, key);
  const base = new Date(`${config.anchor}T00:00:00.000Z`).getTime();
  const at = (days: number, hour = 12, minute = 0) => new Date(base + days * dayMs + ((hour + 3) * 60 + minute) * 60_000);
  const users: User[] = [];
  const agents: Prisma.AgenteCriativoCreateManyInput[] = [];
  const contractors: Prisma.ContratanteCreateManyInput[] = [];
  const works: Prisma.PortfolioCreateManyInput[] = [];
  const events: Prisma.EventoCreateManyInput[] = [];
  const albums: Prisma.EventoAlbumCreateManyInput[] = [];
  const jobs: Prisma.ProjetoCreateManyInput[] = [];
  const eventRequests: Prisma.SolicitacaoEventoCreateManyInput[] = [];
  const jobRequests: Prisma.CandidaturaCreateManyInput[] = [];
  const reviews: Prisma.AvaliacaoCreateManyInput[] = [];
  const art: Artwork[] = [];
  const accounts: Record<string, string> = {};
  const agentsById = new Map<string, Specialty>();
  const contractorCities = new Map<string, City>();
  const makeArt = (owner: string, category: string, kind: Artwork['kind'], index = 0) => {
    const filename = `${id(`art:${owner}:${kind}:${index}`)}.png`;
    art.push({ filename, owner, category, kind });
    return `/uploads/${filename}`;
  };
  const addUser = (kind: string, index: number, tipo: TipoUsuario) => {
    const key = `${kind}-${String(index + 1).padStart(2, '0')}`;
    const email = `${config.batch}.${key}@example.com`;
    const userId = id(key);
    const criadoEm = at(-faker.number.int({ min: 110, max: 650 }));
    users.push({ id: userId, email, tipo, criadoEm });
    if (index === 0) accounts[kind] = email;
    return { userId, criadoEm, profileId: id(`perfil:${key}`) };
  };

  const assignment = faker.helpers.shuffle(specialties.flatMap((specialty) => Array<Specialty>(specialty.quota).fill(specialty)));
  for (const city of cities) {
    for (let position = 0; position < city.counts[0]; position++) {
      const index = agents.length;
      const { userId, profileId, criadoEm } = addUser('agente', index, 'AGENTE');
      const specialty = assignment[index];
      const years = faker.number.int({ min: 1, max: 14 });
      const audience = faker.helpers.arrayElement(['coletivos de bairro', 'produtores independentes', 'projetos educativos', 'espaços culturais', 'artistas iniciantes']);
      const angle = subject();
      const bios = [
        `Em ${city.name}, trabalho com ${specialty.practice}. Nos últimos ${years} anos, desenvolvi métodos de colaboração com ${audience} para investigar ${angle}.`,
        `Meu percurso de ${years} anos passa por ${specialty.practice}. Tenho base em ${city.name} e procuro parcerias com ${audience} em propostas sobre ${angle}.`,
        `Sou profissional de ${specialty.name.toLowerCase()} em ${city.name}. Desenvolvo ${specialty.practice} para ${audience}. Minha pesquisa, construída ao longo de ${years} anos, acompanha ${angle}.`,
      ];
      agents.push({
        id: profileId, usuarioId: userId, nome: faker.person.fullName() + demo, especialidade: specialty.name,
        bio: faker.helpers.arrayElement(bios), cidade: city.name, estado: 'SP', visivelMapa: true,
        ...pointInCity(city, position), criadoEm,
        avatarUrl: makeArt(profileId, specialty.name, 'avatar'), bannerUrl: makeArt(profileId, specialty.name, 'banner'),
        totalProjetos: 0, totalAvaliacoes: 0, notaMedia: 0,
      });
      agentsById.set(profileId, specialty);
      for (const [workIndex, title] of specialty.works.entries()) {
        const workId = id(`obra:${profileId}:${workIndex}`);
        const context = subject();
        works.push({
          id: workId, agenteId: profileId, titulo: `${title} · ${city.name} #${String(index + 1).padStart(2, '0')}${demo}`,
          descricao: `Estudo demonstrativo sobre ${context}. A proposta combina ${specialty.techniques} e foi planejada para circular entre ${audience}. A imagem é ilustrativa.`,
          imageUrl: makeArt(workId, specialty.name, 'work'), criadoEm: at(-14 - index - workIndex * 12),
        });
      }
    }
  }

  const eventHosts: string[] = [];
  const employers: string[] = [];
  for (const city of cities) {
    for (const role of ['eventos', 'oportunidades'] as const) {
      const isHost = role === 'eventos';
      const ids = isHost ? eventHosts : employers;
      for (let position = 0; position < city.counts[isHost ? 1 : 2]; position++) {
        const index = ids.length;
        const { userId, profileId, criadoEm } = addUser(role, index, isHost ? 'CONTRATANTE_EVENTOS' : 'CONTRATANTE_OPORTUNIDADES');
        const person = faker.person.fullName() + demo;
        const organization = isHost ? `Coletivo ${organizations[index]}${demo}` : undefined;
        const specialty = specialties[index % specialties.length].name;
        contractors.push({
          id: profileId, usuarioId: userId, nome: person, empresa: organization, cidade: city.name, estado: 'SP',
          descricao: isHost
            ? `Organização fictícia de ${city.name} dedicada a atividades culturais sobre ${subject()}. O coletivo articula espaços públicos, produtores e artistas da região.`
            : `Profissional independente em ${city.name}. Contrato trabalhos de ${specialty.toLowerCase()} para iniciativas relacionadas a ${subject()}.`,
          categoria: isHost ? 'Produção cultural' : specialty,
          avatarUrl: makeArt(profileId, specialty, 'avatar'), bannerUrl: makeArt(profileId, specialty, 'banner'), criadoEm,
        });
        ids.push(profileId);
        contractorCities.set(profileId, city);
      }
    }
  }

  const candidates = (allowed: (specialty: Specialty) => boolean, count: number) => {
    const eligible = agents.slice(0, -2).filter((agent) => allowed(agentsById.get(agent.id!)!));
    if (eligible.length < count) throw new Error('Pool de agentes compatíveis insuficiente.');
    return faker.helpers.shuffle(eligible).slice(0, count);
  };
  const reviewPairs = new Map<string, { agenteId: string; contratanteId: string; after: Date }>();
  const rememberReview = (agenteId: string, contratanteId: string, after: Date) => {
    reviewPairs.set(`${agenteId}:${contratanteId}`, { agenteId, contratanteId, after });
  };

  for (const [index, host] of eventHosts.entries()) {
    const homeCity = contractorCities.get(host)!;
    const organizer = contractors.find((profile) => profile.id === host)!.empresa!;
    for (let edition = 0; edition < 3; edition++) {
      const number = index * 3 + edition;
      const city = edition === 2 && index < 2 ? cities[7 + index] : homeCity;
      const [category, name, program] = eventFormats[number % eventFormats.length];
      // Cada organização tem uma edição concluída; três têm uma edição na data de referência.
      const offset = edition === 0 ? -5 - index * 3 : edition === 1 && index < 3 ? 0 : 3 + number * 2;
      const date = at(offset, 15 + number % 6);
      const eventId = id(`evento:${number}`);
      const point = pointInCity(city, 12 + number);
      events.push({
        id: eventId, contratanteId: host, organizador: organizer, categoria: category, cidade: city.name,
        titulo: `${name} · ${organizations[index]}${demo}`, descricao: `Programação demonstrativa em ${city.name}, com ${program}. Tema desta edição: ${subject()}. Para propor participação, apresente no portfólio uma experiência relacionada a ${category.toLowerCase()}.`,
        local: `Espaço cultural demonstrativo · ${city.name}`, ...point,
        dataEvento: date, horario: `${15 + number % 6}:00`, criadoEm: at(Math.min(offset - 40, -12)),
        premium: [1, 4, 9, 17, 24].includes(number), fixado: [2, 7, 19, 27].includes(number),
        imagemUrl: makeArt(eventId, category, 'event'),
      });

      const discipline = specialties.find((item) => item.name === category || (category === 'Design' && item.name === 'Design gráfico'));
      const related = (item: Specialty) => item.field === discipline?.field || item.name === 'Produção cultural' || item.name === 'Fotografia';
      const past = offset < 0;
      const applicants = candidates(related, past ? 6 : 3);
      applicants.forEach((agent, application) => {
        const agentId = agent.id!;
        const status = past ? (application < 5 ? 'ACEITA' : 'RECUSADA') :
          application === 0 && number % 2 ? 'ACEITA' : application === 2 && number % 3 ? 'RECUSADA' : 'PENDENTE';
        eventRequests.push({
          id: id(`inscricao:${number}:${application}`), agenteId: agentId, eventoId: eventId, status,
          mensagem: `Participo da cena de ${agentsById.get(agentId)!.name.toLowerCase()} em ${agent.cidade}. Minha proposta de colaboração é uma atividade sobre ${subject()}.`,
          criadoEm: at(Math.min(offset - 4 - application, -1)),
        });
        if (past && status === 'ACEITA') rememberReview(agentId, host, at(offset + 1));
      });
      if (past) albums.push({
        eventoId: eventId,
        fotos: [makeArt(eventId, category, 'album', 1), makeArt(eventId, category, 'album', 2)],
      });
    }
  }

  for (const [index, [specialty, title, budget, brief]] of opportunityBriefs.entries()) {
    const owner = employers[index];
    const jobId = id(`vaga:${index}`);
    const city = contractorCities.get(owner)!;
    const status = index < 5 ? 'ABERTO' : index === 5 ? 'EM_ANDAMENTO' : index < 9 ? 'CONCLUIDO' : 'CANCELADO';
    const offset = status === 'CONCLUIDO' ? -21 - index : status === 'CANCELADO' ? -8 : 12 + index * 3;
    jobs.push({
      id: jobId, contratanteId: owner, status, categoria: specialty, titulo: title + demo,
      descricao: `Oportunidade fictícia em ${city.name} com remuneração demonstrativa. ${brief} Envie um portfólio com trabalhos em ${specialty.toLowerCase()} e informe sua disponibilidade.`,
      orcamento: budget, criadoEm: at(-63 + index), dataEvento: at(offset),
    });
    const discipline = specialties.find((item) => item.name === specialty)!;
    candidates((item) => item.field === discipline.field, 4).forEach((agent, application) => {
      const agentId = agent.id!;
      const accepted = application === 0 && ['CONCLUIDO', 'EM_ANDAMENTO'].includes(status);
      jobRequests.push({
        id: id(`candidatura:${index}:${application}`), agenteId: agentId, projetoId: jobId,
        status: accepted ? 'ACEITA' : status === 'ABERTO' && application !== 3 ? 'PENDENTE' : 'RECUSADA',
        mensagem: `Atuo com ${agentsById.get(agentId)!.practice}. Posso apresentar uma proposta inicial alinhada ao escopo e negociar as entregas com a equipe.`,
        criadoEm: at(-49 + index + application),
      });
      if (accepted) agent.totalProjetos = (agent.totalProjetos ?? 0) + 1;
      if (accepted && status === 'CONCLUIDO') rememberReview(agentId, owner, at(offset + 2));
    });
  }

  const comments = [
    ['A entrega precisou ser refeita e o escopo ficou incompleto.'],
    ['Houve atrasos relevantes e a equipe precisou rever parte do combinado.', 'O material exigiu mais revisões do que prevíamos.'],
    ['O resultado atendeu ao essencial, com ajustes depois da primeira entrega.', 'A proposta funcionou, embora o cronograma pudesse ser mais claro.'],
    ['O trabalho foi cuidadoso e a comunicação ajudou a resolver os ajustes.', 'A entrega correspondeu ao combinado e a parceria foi organizada.'],
    ['A equipe recebeu um trabalho consistente, no prazo e com ótimo cuidado de produção.', 'A colaboração foi fluida e o resultado dialogou muito bem com o público.', 'A apresentação final superou a expectativa e trouxe soluções próprias.'],
  ];
  const orderedPairs = faker.helpers.shuffle([...reviewPairs.values()]);
  const count = orderedPairs.length;
  for (const [index, pair] of orderedPairs.entries()) {
    const p = (index + 0.5) / count;
    const nota = p < 0.45 ? 5 : p < 0.80 ? 4 : p < 0.95 ? 3 : p < 0.99 ? 2 : 1;
    reviews.push({
      id: id(`avaliacao:${pair.agenteId}:${pair.contratanteId}`), agenteId: pair.agenteId,
      contratanteId: pair.contratanteId, nota, criadoEm: pair.after,
      comentario: faker.helpers.arrayElement(comments[nota - 1]) + demo,
    });
  }
  for (const agent of agents) {
    const received = reviews.filter((review) => review.agenteId === agent.id);
    agent.totalAvaliacoes = received.length;
    agent.notaMedia = received.length ? received.reduce((sum, review) => sum + review.nota, 0) / received.length : 0;
  }

  return { config, accounts, users, agents, contractors, works, events, albums, jobs, eventRequests, jobRequests, reviews, art };
}

export type Plan = ReturnType<typeof makePlan>;
