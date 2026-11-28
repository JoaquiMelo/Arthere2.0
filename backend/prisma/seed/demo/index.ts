import { parseArgs } from 'node:util';
import { config as loadEnvironment } from 'dotenv';
import { activeBatch, assertAvailable, assertEmpty, cleanup, cleanupPlan, ensureLedger, listBatches, population, report, validation } from './batches';
import { cities, specialties } from './catalog';
import { prepareImages } from './images';
import { makePlan, todayInBrazil, type SeedConfig } from './plan';
import { backup, connect, databaseTarget, inspect, SeedError, verifyBackup } from './safety';
import { validatePlan } from './validate';

const commands = ['preview', 'populate', 'validate', 'clean-preview', 'clean', 'report', 'backup'];
const log = (data: unknown) => console.log(JSON.stringify(data, null, 2));

function settings(batchOption?: string) {
  const batch = batchOption ?? process.env.DEMO_SEED_BATCH_ID ?? 'baixada';
  const seed = Number(process.env.DEMO_SEED_RANDOM_SEED ?? 20261128);
  const requestedAnchor = process.env.DEMO_SEED_ANCHOR || undefined;
  const anchor = requestedAnchor ?? todayInBrazil();
  if (!/^[a-z][a-z0-9-]{0,35}$/.test(batch) || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new SeedError('Use um lote com até 36 letras minúsculas, números ou hífen e uma semente inteira entre 0 e 4294967295.');
  }
  const parsedDate = new Date(`${anchor}T00:00:00Z`);
  if (!/^20[2-9]\d-\d{2}-\d{2}$/.test(anchor) || !Number.isFinite(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== anchor) throw new SeedError('A data de referência precisa ser uma data civil válida entre 2020 e 2099.');
  return { config: { batch, seed, anchor } satisfies SeedConfig, requestedAnchor };
}

function planReport(config: SeedConfig) {
  const plan = makePlan(config);
  const counts = validatePlan(plan);
  const { credits } = prepareImages(plan);
  return {
    lote: config,
    quantidades: counts,
    cidades: cities.map(({ name, counts: [agentes, eventos, oportunidades] }) => ({ cidade: name, agentes, eventos, oportunidades })),
    especialidades: specialties.map(({ name, quota }) => ({ especialidade: name, agentes: quota })),
    programacao: { concluídos: 10, noDiaDaReferência: 3, futuros: 17, premium: 5, fixados: 4 },
    imagens: {
      acervoLicenciado: credits.filter(({ original }) => original !== null).length,
      ilustracoesOriginais: credits.filter(({ original }) => original === null).length,
      fallbacks: credits.filter(({ status }) => status === 'fallback-validado').length,
      bytes: credits.reduce((total, image) => total + image.bytes, 0),
    },
    contasDeAcesso: plan.accounts,
  };
}

function passwordForSamples() {
  const password = process.env.DEMO_SEED_PASSWORD ?? '';
  if (Buffer.byteLength(password) < 20 || Buffer.byteLength(password) > 72 || new Set(password).size < 12) {
    throw new SeedError('Defina DEMO_SEED_PASSWORD com uma senha aleatória, entre 20 e 72 bytes.');
  }
  return password;
}

async function main() {
  loadEnvironment({ quiet: true });
  const action = process.argv[2];
  if (!commands.includes(action)) throw new SeedError('Comando de demonstração inválido.');
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      batch: { type: 'string' }, confirm: { type: 'string' }, backup: { type: 'string' },
      'full-manifest': { type: 'boolean' },
    },
  });

  const { config, requestedAnchor } = settings(values.batch);
  const url = process.env.DEMO_SEED_DATABASE_URL;
  if (!url && action === 'preview') {
    log({ destino: 'não configurado', modo: 'prévia offline', conflitos: 'verificação local do plano; falta consultar o destino', ...planReport(config) });
    return;
  }
  if (!url) throw new SeedError('Defina DEMO_SEED_DATABASE_URL para o schema dedicado de demonstração.');
  const target = databaseTarget(url, process.env.DATABASE_URL, process.env.DEMO_SEED_ALLOW_PRIMARY_DATABASE === 'true');
  if (target.primary && config.batch !== 'baixada') throw new SeedError('Use o lote baixada no banco principal.');
  const writes = action === 'populate' || action === 'clean';
  if (writes && (process.env.DEMO_SEED_ALLOW_WRITE !== 'true' || values.confirm !== target.database || !values.backup)) {
    throw new SeedError('Informe DEMO_SEED_ALLOW_WRITE=true, --confirm com o nome exato do schema e --backup com o ID verificado.');
  }
  if ((action === 'clean' || action === 'clean-preview') && !values.batch) {
    throw new SeedError('Identifique explicitamente o lote a limpar com --batch.');
  }
  const password = action === 'populate' ? passwordForSamples() : undefined;
  const db = connect(target);
  try {
    const info = await inspect(db, target);
    const current = info.hasControl ? await activeBatch(db) : undefined;
    if (current?.config.batch === config.batch && !requestedAnchor) config.anchor = current.config.anchor;

    switch (action) {
      case 'backup':
        log({ status: 'backup verificado', ...await backup(target, info) });
        break;
      case 'preview': {
        const blockers: string[] = [];
        if (current) {
          if (JSON.stringify(current.config) !== JSON.stringify(config)) blockers.push('Já existe um lote ativo com outra configuração.');
          const check = await validation(db, current.config.batch, target.primary);
          if (!check.valid) blockers.push('O lote ativo sofreu alterações ou recebeu registros externos.');
        } else {
          try {
            if (target.primary) await assertAvailable(db, makePlan(config));
            else await assertEmpty(db);
          } catch (error) {
            if (!(error instanceof SeedError)) throw error;
            blockers.push(error.message);
          }
        }
        if (info.hasControl && (await listBatches(db)).some((row) => row.batch === config.batch && row.state === 'cleaned')) {
          blockers.push('O identificador do lote já foi usado em uma execução removida.');
        }
        log({ destino: info.target, modo: 'somente leitura', migrations: 'compatíveis', conflitos: blockers,
          ...planReport(config) });
        if (blockers.length) process.exitCode = 1;
        break;
      }
      case 'populate': {
        await verifyBackup(target, info, values.backup!);
        if (!info.hasControl) {
          if (target.primary) await assertAvailable(db, makePlan(config));
          else await assertEmpty(db);
          await ensureLedger(db);
        }
        console.error(JSON.stringify({ fase: 'preparando lote', destino: info.target, lote: config.batch }));
        const { status, manifest } = await population(db, makePlan(config), password!, values.backup!, target.primary);
        log({ destino: info.target, status, lote: manifest.config, quantidades: manifest.counts,
          contasDeAcesso: manifest.accounts, backup: manifest.backupId });
        break;
      }
      case 'validate': {
        if (!info.hasControl) throw new SeedError('Nenhum lote registrado neste destino.');
        const result = await validation(db, config.batch, target.primary);
        log({ destino: info.target, ...result });
        if (!result.valid) process.exitCode = 1;
        break;
      }
      case 'clean-preview': {
        if (!info.hasControl) throw new SeedError('Nenhum lote registrado neste destino.');
        const planned = await db.$transaction((tx) => cleanupPlan(tx, config.batch, target.primary),
          { isolationLevel: 'RepeatableRead', timeout: 45_000 });
        log({ destino: info.target, modo: 'somente leitura', ...planned });
        if (planned.blocked) process.exitCode = 1;
        break;
      }
      case 'clean': {
        if (!info.hasControl) throw new SeedError('Nenhum lote registrado neste destino.');
        await verifyBackup(target, info, values.backup!);
        log({ destino: info.target, status: 'removido', ...await cleanup(db, config.batch, values.backup!, target.primary) });
        break;
      }
      case 'report': {
        const rows = info.hasControl ? report(await listBatches(db), values.batch) : [];
        log({ destino: info.target, lotes: values['full-manifest'] ? rows : rows.map(({ manifest, ...row }) => ({
          ...row, config: manifest.config, quantidades: manifest.counts, contasDeAcesso: manifest.accounts,
          backup: manifest.backupId, imagensComCredito: manifest.credits.filter(({ original }) => original !== null).length,
          ...('cleanup' in manifest ? { limpeza: manifest.cleanup } : {}),
        })) });
        break;
      }
    }
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  if (error instanceof SeedError) console.error(JSON.stringify({ erro: error.message }));
  else {
    const code = String((error as { code?: string })?.code ?? '');
    const safeCode = /^[A-Z][A-Z0-9_]{2,40}$/.test(code) ? code : 'FALHA_OPERACIONAL';
    console.error(JSON.stringify({ erro: 'Verifique a conexão, as dependências do seed e os argumentos informados.', codigo: safeCode }));
  }
  process.exitCode = 1;
});
