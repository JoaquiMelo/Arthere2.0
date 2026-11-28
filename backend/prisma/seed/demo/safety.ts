import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, type Prisma } from '../../../src/generated/prisma/client';
import { sha256 } from './images';

export class SeedError extends Error {}

export const controlTable = 'arthere_demo_seed_batches';
const applicationTables = [
  'usuario', 'agente_criativo', 'contratante', 'portfolio', 'evento', 'evento_album',
  'projeto', 'candidatura', 'avaliacao', 'solicitacao_evento', 'upload_imagem', 'conversa', 'mensagem',
];
const expectedTables = new Set([...applicationTables, '_prisma_migrations', controlTable]);
type Queryable = Pick<Prisma.TransactionClient, '$queryRaw' | '$executeRaw'>;

export function databaseTarget(value: string, other?: string) {
  const url = parseTarget(value);
  const { host, port, database } = url;
  if (!/^arthere_demo_[a-z0-9_]{1,40}$/.test(database) || !url.user || !url.password) {
    throw new SeedError('Use um banco arthere_demo_* com usuário dedicado e credenciais próprias.');
  }
  if (other) {
    const application = parseTarget(other, false);
    if (application.database.toLowerCase() === database) {
      throw new SeedError('O nome do banco-alvo coincide com DATABASE_URL. Separe os destinos antes de continuar.');
    }
  }
  return { ...url, label: `${host}:${port}/${database}` };
}

function parseTarget(value: string, strict = true) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const port = Number(url.port || 3306);
    const user = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const database = decodeURIComponent(url.pathname.slice(1));
    const local = ['127.0.0.1', 'localhost'].includes(host);
    if (url.protocol !== 'mysql:' || !host || !database || !Number.isInteger(port)
      || (strict && (url.hash || url.search || /[\u0000-\u001f\u007f]/.test(user + password)))) throw new Error();
    return { host, port, user, password, database, local };
  } catch {
    throw new SeedError('URL do banco inválida. Use mysql:// com credenciais codificadas e um banco explícito, sem parâmetros.');
  }
}

export type Target = ReturnType<typeof databaseTarget>;

export function connect(target: Target) {
  const { host, port, user, password, database, local } = target;
  return new PrismaClient({ adapter: new PrismaMariaDb({
    host, port, user, password, database,
    ...(local ? {} : { ssl: { rejectUnauthorized: true } }),
    connectionLimit: 4, connectTimeout: 5_000, acquireTimeout: 8_000,
  }) });
}

export async function inspect(db: Queryable, target: Target) {
  const [current] = await db.$queryRaw<{ databaseName: string; serverName: string }[]>
    `SELECT DATABASE() AS databaseName, @@hostname AS serverName`;
  if (current?.databaseName !== target.database) throw new SeedError('O banco conectado diverge do destino de demonstração.');

  const tables = await db.$queryRaw<{ tableName: string; engine: string | null }[]>
    `SELECT TABLE_NAME AS tableName, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`;
  const names = new Set(tables.map((item) => item.tableName));
  if (tables.some(({ tableName, engine }) => !expectedTables.has(tableName) || engine !== 'InnoDB')
    || [...applicationTables, '_prisma_migrations'].some((table) => !names.has(table))) {
    throw new SeedError('O destino precisa ter apenas as tabelas InnoDB do Arthere e as migrations aplicadas.');
  }
  const migrations = await db.$queryRaw<{ migration_name: string }[]>
    `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  const actual = new Set(migrations.map((item) => item.migration_name));
  const expected = (await readdir(join(__dirname, '..', '..', 'migrations'), { withFileTypes: true }))
    .filter((item) => item.isDirectory()).map((item) => item.name);
  if (expected.length !== actual.size || expected.some((item) => !actual.has(item))) {
    throw new SeedError('As migrations aplicadas no destino divergem da versão do seed.');
  }
  const foreign = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM information_schema.KEY_COLUMN_USAGE
    WHERE (REFERENCED_TABLE_SCHEMA = DATABASE() AND TABLE_SCHEMA <> DATABASE())
       OR (TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_SCHEMA <> DATABASE())`;
  const triggers = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()`;
  if (Number(foreign[0].count) || Number(triggers[0].count)) {
    throw new SeedError('O destino possui triggers ou referências entre bancos. A operação foi interrompida.');
  }

  const grants = await db.$queryRaw<Record<string, unknown>[]>`SHOW GRANTS FOR CURRENT_USER()`;
  const schemaGrant = ` ON \`${target.database.replaceAll('_', '\\_')}\`.* TO `;
  if (!grants.length || grants.some((row) => {
    const grant = String(Object.values(row)[0]);
    return /WITH GRANT OPTION/i.test(grant) || (!/^GRANT USAGE ON \*\.\* TO /i.test(grant) && !grant.includes(schemaGrant));
  })) {
    throw new SeedError('O usuário do seed deve ter acesso apenas ao schema demonstrativo (escape os underscores no GRANT) e não pode delegar permissões.');
  }

  return { target: target.label, identity: sha256(`${target.label}|${current.serverName}`), hasControl: names.has(controlTable) };
}

export type DatabaseInfo = Awaited<ReturnType<typeof inspect>>;

type Backup = { id: string; identity: string; target: string; createdAt: string; sha256: string; bytes: number };

async function artifactDirectory() {
  const configured = process.env.DEMO_SEED_ARTIFACT_DIR;
  if (!configured || !isAbsolute(configured)) {
    throw new SeedError('Defina DEMO_SEED_ARTIFACT_DIR para um diretório privado, absoluto e fora do repositório.');
  }
  const directory = await realpath(configured);
  const repo = await realpath(resolve(__dirname, '../../../../'));
  const fromRepo = relative(repo, directory);
  if (!fromRepo || (!fromRepo.startsWith('..') && !isAbsolute(fromRepo))) {
    throw new SeedError('Backups e relatórios devem ficar fora do repositório.');
  }
  const info = await stat(directory);
  if (!info.isDirectory() || (process.platform !== 'win32' && Boolean(info.mode & 0o077))) {
    throw new SeedError('O diretório de artefatos precisa ser privado. Em Linux/macOS, use chmod 700.');
  }
  return directory;
}

async function hashFile(path: string) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function checkDump(path: string, database: string) {
  let header = '';
  let tail = '';
  await pipeline(createReadStream(path), createGunzip(), async (stream) => {
    for await (const block of stream) {
      const text = block.toString('utf8');
      if (header.length < 32_768) header = (header + text).slice(0, 32_768);
      tail = (tail + text).slice(-2_048);
    }
  });
  if (!header.includes(`-- Current Database: \`${database}\``) || !tail.includes('-- Dump completed on ')) {
    throw new SeedError('O dump não contém o cabeçalho do destino ou a marca de conclusão.');
  }
}

const backupIdPattern = /^[0-9]{14}-[a-f0-9]{8}$/;

export async function verifyBackup(target: Target, info: DatabaseInfo, id: string) {
  if (!backupIdPattern.test(id)) throw new SeedError('Use o ID retornado por seed:demo:backup.');
  const directory = await artifactDirectory();
  const root = join(directory, id);
  try {
    const receipt: Backup = JSON.parse(await readFile(root + '.json', 'utf8'));
    const file = root + '.sql.gz';
    const age = Date.now() - Date.parse(receipt.createdAt);
    const snapshot = await stat(file);
    if (receipt.id !== id || receipt.target !== info.target || receipt.identity !== info.identity
      || !(age >= 0 && age <= 24 * 60 * 60 * 1000)
      || !snapshot.isFile() || snapshot.size !== receipt.bytes || snapshot.size === 0
      || (process.platform !== 'win32' && Boolean(snapshot.mode & 0o077))
      || await hashFile(file) !== receipt.sha256) {
      throw new Error();
    }
    await checkDump(file, target.database);
    return receipt;
  } catch {
    throw new SeedError('Backup ausente, vencido, íntegro apenas parcialmente ou de outro destino. Gere um novo backup verificado.');
  }
}

export async function backup(target: Target, info: DatabaseInfo) {
  const directory = await artifactDirectory();
  const started = new Date();
  const id = `${started.toISOString().slice(0, 19).replace(/\D/g, '')}-${randomUUID().slice(0, 8)}`;
  const root = join(directory, id);
  const options = await mkdtemp(join(tmpdir(), 'arthere-dump-'));
  const optionFile = join(options, 'client.cnf');
  const escaped = JSON.stringify(target.password);
  try {
    await writeFile(optionFile, `[client]\npassword=${escaped}\n`, { flag: 'wx', mode: 0o600 });
    const args = [
      `--defaults-file=${optionFile}`, '--protocol=TCP', `--host=${target.host}`,
      `--port=${target.port}`, `--user=${target.user}`, '--single-transaction', '--skip-lock-tables',
      '--quick', '--hex-blob', '--default-character-set=utf8mb4', '--skip-add-drop-table',
      ...(target.local ? [] : ['--ssl', '--ssl-verify-server-cert']),
      '--databases', target.database,
    ];
    const child = spawn(process.env.DEMO_SEED_DUMP_BIN || 'mariadb-dump', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stderr.resume();
    const exit = new Promise<void>((done, fail) => {
      child.once('error', fail);
      child.once('close', (code) => code === 0 ? done() : fail(new Error('dump')));
    });
    const file = root + '.sql.gz';
    try {
      await Promise.all([exit, pipeline(child.stdout, createGzip(), createWriteStream(file, { flags: 'wx', mode: 0o600 }))]);
      await checkDump(file, target.database);
      const receipt: Backup = {
        id, identity: info.identity, target: info.target, createdAt: started.toISOString(),
        sha256: await hashFile(file), bytes: (await stat(file)).size,
      };
      await writeFile(root + '.json', JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 });
      return { ...await verifyBackup(target, info, id), file };
    } catch {
      child.kill();
      await rm(file, { force: true });
      await rm(root + '.json', { force: true });
      throw new SeedError('Não foi possível gerar um dump consistente. Verifique o cliente MariaDB, o acesso e a integridade do destino.');
    }
  } finally {
    await rm(options, { recursive: true, force: true });
  }
}
