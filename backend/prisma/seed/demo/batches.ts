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
  const data = {
    usuarios: await db.usuario.findMany({ select: { id: true, email: true, tipo: true, criadoEm: true } }),
    agentes: await db.agenteCriativo.findMany(),
    contratantes: await db.contratante.findMany(),
    trabalhos: await db.portfolio.findMany(),
    eventos: await db.evento.findMany(),
    albuns: await db.eventoAlbum.findMany(),
    vagas: await db.projeto.findMany(),
    solicitacoesEvento: await db.solicitacaoEvento.findMany(),
    candidaturasVaga: await db.candidatura.findMany(),
    avaliacoes: await db.avaliacao.findMany(),
    imagens: await db.$queryRaw<{ filename: string; mime: string; sha256: string }[]>
      `SELECT filename, mime, SHA2(conteudo, 256) AS sha256 FROM upload_imagem`,
    conversas: await db.conversa.findMany({ select: { id: true } }),
    mensagens: await db.mensagem.findMany({ select: { id: true } }),
  };
  const id = (row: Identified) => row.id ?? row.filename ?? row.eventoId!;
  const sorted = Object.entries(data).map(([group, rows]) => [group, (rows as Identified[]).sort((a, b) => compare(id(a), id(b)))] as const);
  return {
    ids: Object.fromEntries(sorted.map(([group, rows]) => [group, rows.map(id)])),
    digest: sha256(JSON.stringify(sorted)),
    images: data.imagens,
  };
}

type Snapshot = Awaited<ReturnType<typeof snapshot>>;

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

export async function population(db: PrismaClient, plan: Plan, password: string, backupId: string) {
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
      const current = await snapshot(tx);
      if (current.digest !== active.digest) throw new SeedError('O lote existe, mas sofreu alterações. Execute a validação para identificar divergências.');
      return { status: 'inalterado', manifest: active };
    }
    if ((await listBatches(tx)).some(({ batch }) => batch === plan.config.batch)) {
      throw new SeedError('Este identificador pertence a uma execução anterior. Escolha um novo lote.');
    }
    await assertEmpty(tx);
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

    const current = await snapshot(tx);
    const actualImages = new Map(current.images.map((image) => [image.filename, image]));
    const expectedRows = {
      usuarios: plan.users, agentes: plan.agents, contratantes: plan.contractors,
      trabalhos: plan.works, eventos: plan.events, albuns: plan.albums, vagas: plan.jobs,
      solicitacoesEvento: plan.eventRequests, candidaturasVaga: plan.jobRequests, avaliacoes: plan.reviews,
      imagens: images.rows, conversas: [], mensagens: [],
    };
    for (const [group, rows] of Object.entries(expectedRows)) {
      const ids = (rows as Identified[]).map((row) => row.id ?? row.filename ?? row.eventoId!).sort(compare);
      if (JSON.stringify(ids) !== JSON.stringify(current.ids[group])) throw new SeedError(`IDs inesperados em ${group}.`);
    }
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

export async function validation(db: PrismaClient, batch: string) {
  return db.$transaction(async (tx) => {
    const manifest = await activeBatch(tx, batch);
    if (!manifest) throw new SeedError('Lote ativo não encontrado.');
    const current = await snapshot(tx);
    return {
      batch, valid: current.digest === manifest.digest, expected: manifest.counts,
      counts: Object.fromEntries(Object.entries(current.ids).map(([key, ids]) => [key, ids.length])),
      differences: differences(current, manifest),
      contentChanged: current.digest !== manifest.digest,
    };
  }, { isolationLevel: 'RepeatableRead', timeout: 45_000 });
}

export async function cleanupPlan(db: Tx | PrismaClient, batch: string) {
  const manifest = await activeBatch(db, batch);
  if (!manifest) throw new SeedError('Lote ativo não encontrado.');
  const current = await snapshot(db);
  const drift = differences(current, manifest);
  const eligible = Object.fromEntries(Object.entries(current.ids).map(([group, rows]) => {
    const owned = new Set(manifest.ids[group] ?? []);
    return [group, rows.filter((id) => owned.has(id))];
  }));
  const blocked = Object.values(drift).some(({ outside }) => outside > 0);
  return { batch, blocked, differences: drift, eligible };
}

export async function cleanup(db: PrismaClient, batch: string, backupId: string) {
  return locked(db, async (tx) => {
    const planned = await cleanupPlan(tx, batch);
    if (planned.blocked) throw new SeedError('Há registros fora do manifesto. A limpeza foi interrompida para evitar efeitos em cascata.');
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
    await assertEmpty(tx);
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
