import { randomBytes } from 'node:crypto';
import { hash } from 'bcrypt';
import type { Prisma, PrismaClient } from '../../../src/generated/prisma/client';
import { prepareImages, sha256, withImageCredits, type Credit } from './images';
import type { Plan, SeedConfig } from './plan';
import { SeedError } from './safety';
import { amount, validatePlan } from './validate';

type Tx = Prisma.TransactionClient;
type Manifest = {
  version: 1; config: SeedConfig; accounts: Plan['accounts']; counts: ReturnType<typeof amount>;
  ids: Record<string, string[]>; credits: Credit[]; digest: string; backupId: string;
};
type Batch = { batch: string; state: 'active' | 'cleaned'; created: Date; updated: Date; payload: string | Manifest };

const lockId = '__lock__';

export async function ensureLedger(db: PrismaClient) {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS arthere_demo_seed_batches (
      batch VARCHAR(48) NOT NULL PRIMARY KEY,
      state VARCHAR(16) NOT NULL,
      payload LONGTEXT NOT NULL CHECK (JSON_VALID(payload)),
      created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB`;
  await db.$executeRaw`
    INSERT IGNORE INTO arthere_demo_seed_batches (batch, state, payload) VALUES (${lockId}, 'lock', '{}')`;
}

export async function listBatches(db: Tx | PrismaClient) {
  return db.$queryRaw<Batch[]>`
    SELECT batch, state, created, updated, payload
    FROM arthere_demo_seed_batches WHERE batch <> ${lockId} ORDER BY created DESC`;
}

function readManifest(row: Batch) {
  const parsed: Manifest = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  if (parsed.version !== 1 || parsed.config.batch !== row.batch || !parsed.ids || !parsed.credits) {
    throw new SeedError('Manifesto persistido inválido. Revise o lote antes de qualquer escrita.');
  }
  return parsed;
}

export async function activeBatch(db: Tx | PrismaClient, batch?: string) {
  const entries = (await listBatches(db)).filter((row) => row.state === 'active');
  if (entries.length > 1) throw new SeedError('Mais de um lote ativo. Revise o controle demonstrativo.');
  const entry = entries[0];
  return entry && (!batch || entry.batch === batch) ? readManifest(entry) : undefined;
}

const compare = (a: string, b: string) => a.localeCompare(b, 'en');
type Identified = { id?: string; filename?: string; eventoId?: string };

async function snapshot(db: Tx | PrismaClient) {
  return {
    usuarios: await db.usuario.findMany({ select: { id: true, email: true, tipo: true, criadoEm: true, senha: true } }),
    agentes: await db.agenteCriativo.findMany(),
    contratantes: await db.contratante.findMany(),
    trabalhos: await db.portfolio.findMany(),
    eventos: await db.evento.findMany(),
    albuns: await db.eventoAlbum.findMany(),
    vagas: await db.projeto.findMany(),
    solicitacoesEvento: await db.solicitacaoEvento.findMany(),
    candidaturasVaga: await db.candidatura.findMany(),
    avaliacoes: await db.avaliacao.findMany(),
    imagens: await db.$queryRaw<{ filename: string; mime: string; sha256: string; criadoEm: Date }[]>
      `SELECT filename, mime, SHA2(conteudo, 256) AS sha256, criadoEm FROM upload_imagem`,
    conversas: await db.conversa.findMany(),
    mensagens: await db.mensagem.findMany(),
  };
}

type Data = Awaited<ReturnType<typeof snapshot>>;
type Row = Identified & Record<string, unknown>;
type Groups = Record<string, Row[]>;
const rowId = (row: Identified) => row.id ?? row.filename ?? row.eventoId!;

function summarize(data: Groups) {
  const sorted = Object.entries(data).map(([group, rows]) => [group, [...rows].sort((a, b) => compare(rowId(a), rowId(b)))] as const);
  const digest = sha256(JSON.stringify(sorted));
  return {
    ids: Object.fromEntries(sorted.map(([group, rows]) => [group, rows.map(rowId)])),
    digest,
  };
}

function partition(data: Data, ids: Manifest['ids'], owned: boolean): Groups {
  return Object.fromEntries(Object.entries(data).map(([group, rows]) => {
    const known = new Set(ids[group] ?? []);
    return [group, (rows as Row[]).filter((row) => known.has(rowId(row)) === owned)];
  }));
}

function legacySummary(data: Groups) {
  return summarize({
    ...data,
    usuarios: data.usuarios.map(({ senha: _, ...row }) => row),
    imagens: data.imagens.map(({ criadoEm: _, ...row }) => row),
    conversas: data.conversas.map(({ id }) => ({ id })),
    mensagens: data.mensagens.map(({ id }) => ({ id })),
  });
}

function checkPreserved(before: Groups, after: Groups) {
  if (summarize(before).digest !== summarize(after).digest) {
    throw new SeedError('Os registros preexistentes divergiram dentro da transação. Operação revertida.');
  }
}

function primaryReferences(outside: Groups, ids: Manifest['ids']) {
  const entityIds = new Set(Object.entries(ids).filter(([group]) => group !== 'imagens').flatMap(([, values]) => values).map((id) => id.toLowerCase()));
  const filenames = new Set((ids.imagens ?? []).map((filename) => filename.toLowerCase()));
  return Object.fromEntries(Object.entries(outside).map(([group, rows]) => [group, rows.filter((row) =>
    Object.entries(row).some(([key, value]) => key.endsWith('Id') && typeof value === 'string' && entityIds.has(value.toLowerCase()))
    || (JSON.stringify(row).toLowerCase().match(/[0-9a-f-]{36}\.png/g) ?? []).some((name) => filenames.has(name)),
  ).length]));
}

function plannedIds(plan: Plan) {
  const records = {
    usuarios: plan.users, agentes: plan.agents, contratantes: plan.contractors,
    trabalhos: plan.works, eventos: plan.events, albuns: plan.albums, vagas: plan.jobs,
    solicitacoesEvento: plan.eventRequests, candidaturasVaga: plan.jobRequests, avaliacoes: plan.reviews,
    imagens: plan.art, conversas: [], mensagens: [],
  };
  return Object.fromEntries(Object.entries(records).map(([group, rows]) =>
    [group, (rows as Identified[]).map(rowId).sort(compare)]));
}

export async function assertAvailable(db: Tx | PrismaClient, plan: Plan, current?: Data) {
  if (await db.usuario.count({ where: { OR: [
    { id: { in: plan.users.map(({ id }) => id!) } },
    { email: { in: plan.users.map(({ email }) => email) } },
  ] } })) throw new SeedError('Há IDs ou e-mails do lote já utilizados por contas que não pertencem ao manifesto.');
  const existing = current ?? await snapshot(db);
  const known = Object.fromEntries(Object.entries(plannedIds(plan)).map(([group, ids]) => [group, ids.map((id) => id.toLowerCase())]));
  const groups = Object.entries(existing).filter(([group, rows]) => {
    const expected = new Set(known[group]);
    return rows.some((row) => expected.has(rowId(row).toLowerCase()));
  });
  if (groups.length) throw new SeedError(`Há identificadores do lote em uso nas tabelas: ${groups.map(([group]) => group).join(', ')}.`);
}

type Snapshot = ReturnType<typeof summarize>;

export async function assertEmpty(db: Tx | PrismaClient) {
  const counts = await Promise.all([
    db.usuario.count(), db.agenteCriativo.count(), db.contratante.count(), db.portfolio.count(),
    db.evento.count(), db.eventoAlbum.count(), db.projeto.count(), db.solicitacaoEvento.count(),
    db.candidatura.count(), db.avaliacao.count(), db.uploadImagem.count(), db.conversa.count(), db.mensagem.count(),
  ]);
  if (counts.some(Boolean)) throw new SeedError('O schema contém registros sem lote ativo. Nenhum dado pode ser apropriado pelo seed.');
}

function differences(actual: Snapshot, expected: Manifest) {
  return Object.fromEntries(Object.entries(actual.ids).map(([group, ids]) => {
    const seen = new Set(ids);
    const owned = new Set(expected.ids[group] ?? []);
    return [group, {
      outside: ids.filter((id) => !owned.has(id)).length,
      missing: [...owned].filter((id) => !seen.has(id)).length,
    }];
  }));
}

async function locked<T>(db: PrismaClient, operation: (tx: Tx) => Promise<T>) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const row = await tx.$queryRaw<{ batch: string }[]>
          `SELECT batch FROM arthere_demo_seed_batches WHERE batch = ${lockId} FOR UPDATE`;
        if (!row.length) throw new SeedError('Registro de bloqueio ausente.');
        return operation(tx);
      }, { isolationLevel: 'Serializable', timeout: 90_000, maxWait: 8_000 });
    } catch (error) {
      if (attempt >= 1 || (error as { code?: string })?.code !== 'P2034') throw error;
      await new Promise((done) => setTimeout(done, 250));
    }
  }
}

export async function population(db: PrismaClient, plan: Plan, password: string, backupId: string, primary = false) {
  const counts = validatePlan(plan);
  const images = prepareImages(plan);
  const { works, events } = withImageCredits(plan, images.credits);
  const interactive = new Set(Object.values(plan.accounts));
  const [sampleHash, lockedHash] = await Promise.all([
    hash(password, 12), hash(randomBytes(24).toString('base64url'), 12),
  ]);

  return locked(db, async (tx) => {
    const active = await activeBatch(tx);
    if (active) {
      if (JSON.stringify(active.config) !== JSON.stringify(plan.config)) {
        throw new SeedError('Já existe um lote ativo com outra configuração. A população não substitui registros.');
      }
      const data = await snapshot(tx);
      const current = primary ? summarize(partition(data, active.ids, true)) : legacySummary(data);
      if (current.digest !== active.digest) throw new SeedError('O lote existe, mas sofreu alterações. Execute a validação para identificar divergências.');
      return { status: 'inalterado', manifest: active };
    }
    if ((await listBatches(tx)).some(({ batch }) => batch === plan.config.batch)) {
      throw new SeedError('Este identificador pertence a uma execução anterior. Escolha um novo lote.');
    }
    const before = primary ? await snapshot(tx) : undefined;
    if (before) await assertAvailable(tx, plan, before);
    else await assertEmpty(tx);
    await tx.usuario.createMany({ data: plan.users.map((user) => ({ ...user, senha: interactive.has(user.email) ? sampleHash : lockedHash })) });
    await tx.agenteCriativo.createMany({ data: plan.agents });
    await tx.contratante.createMany({ data: plan.contractors });
    for (let i = 0; i < images.rows.length; i += 16) {
      await tx.uploadImagem.createMany({ data: images.rows.slice(i, i + 16) });
    }
    await tx.portfolio.createMany({ data: works });
    await tx.evento.createMany({ data: events });
    await tx.eventoAlbum.createMany({ data: plan.albums });
    await tx.projeto.createMany({ data: plan.jobs });
    await tx.solicitacaoEvento.createMany({ data: plan.eventRequests });
    await tx.candidatura.createMany({ data: plan.jobRequests });
    await tx.avaliacao.createMany({ data: plan.reviews });

    const ids = plannedIds(plan);
    const data = await snapshot(tx);
    const current = primary ? summarize(partition(data, ids, true)) : legacySummary(data);
    if (before) checkPreserved(before, partition(data, ids, false));
    for (const [group, values] of Object.entries(ids)) {
      if (JSON.stringify(values) !== JSON.stringify(current.ids[group])) throw new SeedError(`IDs inesperados em ${group}.`);
    }
    const actualImages = new Map(data.imagens.map((image) => [image.filename, image]));
    if (!images.credits.every((credit) => actualImages.get(credit.filename)?.sha256 === credit.sha256
      && actualImages.get(credit.filename)?.mime === 'image/png')) throw new SeedError('Falha na verificação de imagens persistidas.');
    const manifest: Manifest = { version: 1, config: plan.config, accounts: plan.accounts, counts,
      ids: current.ids, credits: images.credits, digest: current.digest, backupId };
    await tx.$executeRaw`
      INSERT INTO arthere_demo_seed_batches (batch, state, payload)
      VALUES (${plan.config.batch}, 'active', ${JSON.stringify(manifest)})`;
    return { status: 'criado', manifest };
  });
}

export async function validation(db: PrismaClient, batch: string, primary = false) {
  return db.$transaction(async (tx) => {
    const manifest = await activeBatch(tx, batch);
    if (!manifest) throw new SeedError('Lote ativo não encontrado.');
    const data = await snapshot(tx);
    const current = primary ? summarize(partition(data, manifest.ids, true)) : legacySummary(data);
    return {
      batch, valid: current.digest === manifest.digest, expected: manifest.counts,
      counts: Object.fromEntries(Object.entries(current.ids).map(([key, ids]) => [key, ids.length])),
      differences: differences(current, manifest),
      contentChanged: current.digest !== manifest.digest,
    };
  }, { isolationLevel: 'RepeatableRead', timeout: 45_000 });
}

export async function cleanupPlan(db: Tx | PrismaClient, batch: string, primary = false) {
  const manifest = await activeBatch(db, batch);
  if (!manifest) throw new SeedError('Lote ativo não encontrado.');
  const data = await snapshot(db);
  const owned = partition(data, manifest.ids, true);
  const current = primary ? summarize(owned) : legacySummary(data);
  const drift = differences(current, manifest);
  const eligible = Object.fromEntries(Object.entries(current.ids).map(([group, rows]) => {
    const owned = new Set(manifest.ids[group] ?? []);
    return [group, rows.filter((id) => owned.has(id))];
  }));
  const references = primary ? primaryReferences(partition(data, manifest.ids, false), manifest.ids) : {};
  // Alterações no lote podem ter ligado registros fictícios a registros reais.
  const changedBatch = primary && current.digest !== manifest.digest;
  const blocked = changedBatch || Object.values(references).some(Boolean)
    || (!primary && Object.values(drift).some(({ outside }) => outside > 0));
  return { batch, blocked, changedBatch, references, differences: drift, eligible };
}

export async function cleanup(db: PrismaClient, batch: string, backupId: string, primary = false) {
  return locked(db, async (tx) => {
    const planned = await cleanupPlan(tx, batch, primary);
    if (planned.blocked) throw new SeedError('Há referências de registros fora do manifesto ou alterações no lote. Consulte a prévia de limpeza.');
    const before = primary ? partition(await snapshot(tx), planned.eligible, false) : undefined;
    const id = (group: string) => ({ in: planned.eligible[group] });
    await tx.avaliacao.deleteMany({ where: { id: id('avaliacoes') } });
    await tx.candidatura.deleteMany({ where: { id: id('candidaturasVaga') } });
    await tx.solicitacaoEvento.deleteMany({ where: { id: id('solicitacoesEvento') } });
    await tx.eventoAlbum.deleteMany({ where: { eventoId: id('albuns') } });
    await tx.portfolio.deleteMany({ where: { id: id('trabalhos') } });
    await tx.evento.deleteMany({ where: { id: id('eventos') } });
    await tx.projeto.deleteMany({ where: { id: id('vagas') } });
    await tx.agenteCriativo.deleteMany({ where: { id: id('agentes') } });
    await tx.contratante.deleteMany({ where: { id: id('contratantes') } });
    await tx.usuario.deleteMany({ where: { id: id('usuarios') } });
    await tx.uploadImagem.deleteMany({ where: { filename: id('imagens') } });
    if (before) checkPreserved(before, await snapshot(tx));
    else await assertEmpty(tx);
    const manifest = await activeBatch(tx, batch);
    const removed = Object.fromEntries(Object.entries(planned.eligible).map(([group, ids]) => [group, ids.length]));
    const audit = { ...manifest, cleanup: { backupId, removed, at: new Date().toISOString() } };
    await tx.$executeRaw`
      UPDATE arthere_demo_seed_batches SET state = 'cleaned', payload = ${JSON.stringify(audit)} WHERE batch = ${batch}`;
    return { batch, removed };
  });
}

export function report(rows: Batch[], selected?: string) {
  return rows.filter((row) => !selected || row.batch === selected).map((row) => ({
    batch: row.batch, state: row.state, createdAt: row.created, updatedAt: row.updated, manifest: readManifest(row),
  }));
}
