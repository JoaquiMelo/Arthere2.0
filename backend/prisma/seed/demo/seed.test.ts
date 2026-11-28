import assert = require('node:assert/strict');
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { activeBatch, assertEmpty, cleanup, cleanupPlan, ensureLedger, listBatches, population, validation } from './batches';
import { prepareImages, validPng } from './images';
import { demo, makePlan } from './plan';
import { connect, databaseTarget, inspect, stateDigest } from './safety';
import { validatePlan } from './validate';

const config = { batch: 'teste-baixada', seed: 20261128, anchor: '2026-11-28' };

test('geração determinística, distribuição e relacionamentos', () => {
  const plan = makePlan(config);
  assert.deepEqual(makePlan(config), plan);
  assert.notDeepEqual(makePlan({ ...config, seed: 0 }), plan);
  const counts = validatePlan(plan);
  assert.equal(counts.usuarios, 75);
  assert.equal(counts.trabalhos, 150);
  assert.equal(counts.avaliacoes, 53);
  assert.equal(counts.imagens, 350);
});

test('valida coordenada, cronologia e interação necessária para avaliações', () => {
  const coordinates = makePlan(config);
  coordinates.agents[0].latitude = 0;
  assert.throws(() => validatePlan(coordinates), /Coordenadas/);
  const timeline = makePlan(config);
  timeline.eventRequests[0].criadoEm = new Date('2099-01-01');
  assert.throws(() => validatePlan(timeline), /fora de ordem/);
  const ratings = makePlan(config);
  ratings.reviews[0].criadoEm = new Date('2020-01-01');
  assert.throws(() => validatePlan(ratings), /colaboração concluída/);
});

test('fallback para imagens ausentes ou corrompidas, sem duplicatas', () => {
  const plan = makePlan({ ...config, batch: 'banca-qa' });
  const images = prepareImages(plan);
  assert.equal(images.credits.filter(({ original }) => original).length, 7);
  assert.equal(new Set(images.credits.map(({ sha256 }) => sha256)).size, 350);
  assert.ok(images.rows.every(({ conteudo }) => validPng(Buffer.from(conteudo))));
  let index = 0;
  const fallback = prepareImages(plan, () => {
    if (index++ % 2) return Buffer.from('arquivo inválido');
    throw new Error('Arquivo de teste indisponível.');
  });
  assert.equal(fallback.credits.filter(({ original }) => original).length, 0);
  assert.equal(fallback.credits.filter(({ status }) => status === 'fallback-validado').length, 7);
});

test('prévia offline sem credenciais nem conexão ao banco', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'arthere-preview-test-'));
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('DEMO_SEED_') && name !== 'DATABASE_URL'));
  try {
    const result = execFileSync(process.execPath, ['--require', require.resolve('ts-node/register'),
      require.resolve('./index'), 'preview'], { cwd, env: { ...env, TS_NODE_PROJECT: require.resolve('../../../tsconfig.json') } });
    const output = JSON.parse(result.toString());
    assert.equal(output.modo, 'prévia offline');
    assert.equal(output.quantidades.usuarios, 75);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('bloqueia destinos de aplicação e opções de conexão ambíguas', () => {
  assert.throws(() => databaseTarget('mysql://demo:senha@localhost/arthere'), /schema autorizado/);
  assert.throws(() => databaseTarget('mysql://demo:senha@localhost/arthere_demo_qa',
    'mysql://outra:senha@servidor/arthere_demo_qa'), /coincide/);
  assert.throws(() => databaseTarget('mysql://demo:senha@localhost/arthere_demo_qa?database=arthere'), /URL do banco/);
});

const testUrl = process.env.DEMO_SEED_TEST_DATABASE_URL;
test('MariaDB isolado: rollback, concorrência, idempotência, proteção de terceiros e limpeza', { skip: !testUrl }, async () => {
  const target = databaseTarget(testUrl!);
  assert.ok(target.local && /^arthere_demo_(qa|test)(_|$)/.test(target.database), 'Use um MariaDB local descartável de teste.');
  const db = connect(target);
  const password = randomBytes(26).toString('hex');
  const batch = `teste-${randomBytes(5).toString('hex')}`;
  const plan = makePlan({ ...config, batch });
  const outsideId = 'external-record-seed-test';
  try {
    const info = await inspect(db, target);
    await assertEmpty(db);
    if (!info.hasControl) await ensureLedger(db);
    assert.equal(await activeBatch(db), undefined);
    const broken = makePlan(plan.config);
    broken.agents[0].nome = 'a'.repeat(205) + demo;
    await assert.rejects(population(db, broken, password, 'backup-de-teste'));
    await assertEmpty(db);
    assert.equal(await activeBatch(db), undefined);

    const runs = await Promise.all([population(db, plan, password, 'backup-de-teste'), population(db, plan, password, 'backup-de-teste')]);
    assert.deepEqual(runs.map(({ status }) => status).sort(), ['criado', 'inalterado']);
    assert.equal((await validation(db, batch)).valid, true);
    assert.equal((await cleanupPlan(db, batch)).eligible.usuarios.length, 75);
    assert.equal(await db.usuario.count(), 75);

    await db.usuario.create({ data: { id: outsideId, email: 'controle@example.com', senha: 'hash-de-teste', tipo: 'AGENTE' } });
    assert.equal((await cleanupPlan(db, batch)).blocked, true);
    assert.equal((await validation(db, batch)).valid, false);
    await assert.rejects(cleanup(db, batch, 'backup-de-teste'), /fora do manifesto/);
    assert.ok(await db.usuario.findUnique({ where: { id: outsideId } }));
    assert.equal(await db.usuario.count(), 76);
    await db.usuario.delete({ where: { id: outsideId } });
    assert.equal((await cleanup(db, batch, 'backup-de-teste')).removed.usuarios, 75);
    await assertEmpty(db);
    assert.equal((await listBatches(db)).find((row) => row.batch === batch)?.state, 'cleaned');
  } finally {
    await db.$disconnect();
  }
});

test('db_arthere exige opt-in e o mesmo servidor da API', () => {
  const url = 'mysql://demo:senha@localhost/db_arthere';
  assert.throws(() => databaseTarget(url, url), /ALLOW_PRIMARY/);
  assert.throws(() => databaseTarget(url, url.replace('localhost', 'outro'), true), /mesmo host/);
  assert.equal(databaseTarget(url, url, true).primary, true);
});

test('modo compartilhado preserva contas reais e arthere_state e bloqueia referências externas', { skip: !testUrl }, async () => {
  const target = databaseTarget(testUrl!);
  assert.ok(target.local && /^arthere_demo_(qa|test)(_|$)/.test(target.database));
  const db = connect(target);
  const batch = `teste-principal-${randomBytes(4).toString('hex')}`;
  const plan = makePlan({ ...config, batch });
  const password = randomBytes(26).toString('hex');
  try {
    await db.$executeRaw`CREATE TABLE IF NOT EXISTS arthere_state
      (id VARCHAR(40) PRIMARY KEY, counter BIGINT NOT NULL, payload JSON NOT NULL) ENGINE=InnoDB`;
    await db.$executeRaw`INSERT INTO arthere_state (id, counter, payload) VALUES (${batch}, ${9007199254740993n}, '{"demo":false}')`;
    const state = await stateDigest(db);
    assert.ok(state);
    const info = await inspect(db, target);
    assert.equal(info.hasState, true);
    assert.equal(info.hasStateRows, true);
    await assertEmpty(db);
    await ensureLedger(db);
    const real = await db.usuario.create({ data: {
      id: 'real-seed-test', email: 'real@example.com', senha: 'hash-externo', tipo: 'AGENTE',
    } });
    const agent = await db.agenteCriativo.create({ data: { usuarioId: real.id, nome: 'Controle', especialidade: 'Design' } });
    assert.equal((await population(db, plan, password, 'teste', true)).status, 'criado');
    assert.equal((await population(db, plan, password, 'teste', true)).status, 'inalterado');
    assert.equal(await stateDigest(db), state);
    assert.equal((await validation(db, batch, true)).valid, true);
    assert.equal((await cleanupPlan(db, batch, true)).blocked, false);
    const link = await db.solicitacaoEvento.create({ data: { agenteId: agent.id, eventoId: plan.events[0].id! } });
    assert.equal((await cleanupPlan(db, batch, true)).references.solicitacoesEvento, 1);
    await assert.rejects(cleanup(db, batch, 'teste', true), /fora do manifesto/);
    assert.ok(await db.solicitacaoEvento.findUnique({ where: { id: link.id } }));
    await db.solicitacaoEvento.delete({ where: { id: link.id } });
    assert.equal((await cleanup(db, batch, 'teste', true)).removed.usuarios, 75);
    assert.deepEqual(await db.usuario.findUnique({ where: { id: real.id } }), real);
    assert.deepEqual(await db.agenteCriativo.findUnique({ where: { id: agent.id } }), agent);
    assert.equal(await stateDigest(db), state);
    await db.$executeRaw`DELETE FROM arthere_state WHERE id = ${batch}`;
    await db.usuario.delete({ where: { id: real.id } });
    await assertEmpty(db);
  } finally {
    await db.$disconnect();
  }
});
