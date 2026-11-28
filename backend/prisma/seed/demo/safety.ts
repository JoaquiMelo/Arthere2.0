import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import { open, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { Readable } from 'node:stream';
import { createConnection, type Connection } from 'mariadb';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { sha256 } from './images';
import { archive, readArchive, restoreArchive, type ArchiveInfo } from './archive';

export class SeedError extends Error {}

export const controlTable = 'arthere_demo_seed_batches';
const applicationTables = [
  'usuario', 'agente_criativo', 'contratante', 'portfolio', 'evento', 'evento_album',
  'projeto', 'candidatura', 'avaliacao', 'solicitacao_evento', 'upload_imagem', 'conversa', 'mensagem',
];
const stateTable = 'arthere_state';
const expectedTables = new Set([...applicationTables, '_prisma_migrations', controlTable, stateTable]);
type Queryable = { $queryRaw<T>(parts: TemplateStringsArray, ...values: unknown[]): Promise<T> };

export async function stateDigest(db: Queryable) {
  const exists = await db.$queryRaw<unknown[]>`
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${stateTable}`;
  if (!exists.length) return null;
  // The operational table has no Prisma model. Fingerprint every column and row.
  const rows = await db.$queryRaw<Record<string, unknown>[]>`SELECT * FROM arthere_state`;
  return sha256(JSON.stringify(rows.map((row) => JSON.stringify(row, (_, value) => {
    if (typeof value === 'bigint') return { bigint: value.toString() };
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]));
    }
    return value;
  })).sort()));
}

export function databaseTarget(value: string, other?: string, allowPrimary = false, allowExistingAccount = false) {
  const url = parseTarget(value);
  const { host, port, database } = url;
  const primary = database === 'db_arthere';
  const application = other ? parseTarget(other, false) : undefined;
  if (primary && (!allowPrimary || application?.database !== database
    || application.host !== host || application.port !== port)) {
    throw new SeedError('Para db_arthere, habilite DEMO_SEED_ALLOW_PRIMARY_DATABASE e confirme o mesmo host, porta e schema em DATABASE_URL.');
  }
  if ((!primary && !/^arthere_demo_[a-z0-9_]{1,40}$/.test(database)) || !url.user || !url.password) {
    throw new SeedError('Use um schema autorizado com credenciais próprias.');
  }
  if (!primary && application?.database.toLowerCase() === database) {
    throw new SeedError('O nome do banco-alvo coincide com DATABASE_URL. Separe os destinos antes de continuar.');
  }
  if (allowExistingAccount && (!primary || application?.user !== url.user)) {
    throw new SeedError('A autorização de conta compartilhada vale apenas para a conta da API no db_arthere.');
  }
  return { ...url, primary, allowExistingAccount, label: `${host}:${port}/${database}` };
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

function connectionOptions(target: Target) {
  const { host, port, user, password, database, local } = target;
  return {
    host, port, user, password, database,
    ...(local ? {} : { ssl: { rejectUnauthorized: true,
      ...(process.env.DEMO_SEED_TLS_CA ? { ca: readFileSync(process.env.DEMO_SEED_TLS_CA, 'utf8') } : {}),
    } }),
    connectionLimit: 4, connectTimeout: 5_000, acquireTimeout: 8_000,
  };
}

export function connect(target: Target) {
  return new PrismaClient({ adapter: new PrismaMariaDb(connectionOptions(target)) });
}

function reader(connection: Connection) {
  return { $queryRaw: <T>(parts: TemplateStringsArray, ...values: unknown[]): Promise<T> =>
    connection.query(parts.join('?'), values) };
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
  const databaseCode = await db.$queryRaw<{ count: bigint }[]>`
    SELECT (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE())
      + (SELECT COUNT(*) FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()) AS count`;
  if (Number(foreign[0].count) || Number(triggers[0].count) || Number(databaseCode[0].count)) {
    throw new SeedError('O destino possui triggers, rotinas, eventos SQL ou referências entre bancos. A operação foi interrompida.');
  }

  await assertScopedGrants(db, target.database, target.allowExistingAccount);

  const hasState = names.has(stateTable);
  const hasStateRows = hasState && (await db.$queryRaw<unknown[]>`SELECT 1 FROM arthere_state LIMIT 1`).length > 0;
  return { target: target.label, identity: sha256(`${target.label}|${current.serverName}`),
    hasControl: names.has(controlTable), hasState, tables: [...names].sort(), hasStateRows };
}

export function allowedSeedGrants(grants: string[], database: string, allowExistingAccount = false) {
  if (!grants.length) return false;
  const scopes = grants.map((grant) => grant.split(/\s+TO\s+/i)[0]);
  const usage = (grant: string, index: number) => grant === 'GRANT USAGE ON *.*' &&
    !/\bWITH GRANT OPTION\b/i.test(grants[index]);

  if (allowExistingAccount && database === 'db_arthere') {
    // Explicit opt-in for the observed application grants, never for global grants or roles.
    const match = (grant: string) => /^GRANT [A-Z_, ]+ ON `(db\\?_arthere2?)`\.\*$/.exec(grant)?.[1].replace('\\', '');
    return scopes.some((grant) => match(grant) === database)
      && scopes.every((grant, index) => usage(grant, index) || Boolean(match(grant)));
  }

  const schemaGrant = ` ON \`${database.replaceAll('_', '\\_')}\`.*`;
  return scopes.every((grant, index) => !/\bWITH GRANT OPTION\b/i.test(grants[index]) &&
    (usage(grant, index) || (grant.startsWith('GRANT ') && grant.endsWith(schemaGrant))));
}

async function assertScopedGrants(db: Queryable, database: string, allowExistingAccount = false) {
  const grants = await db.$queryRaw<Record<string, unknown>[]>`SHOW GRANTS FOR CURRENT_USER()`;
  if (!allowedSeedGrants(grants.map((row) => String(Object.values(row)[0])), database, allowExistingAccount)) {
    throw new SeedError(allowExistingAccount
      ? 'A conta compartilhada precisa ter acesso a db_arthere. São aceitos grants nesses schemas (db_arthere e db_arthere2) e USAGE global sem delegação.'
      : 'O usuário do seed deve ter acesso apenas ao schema de destino (escape os underscores no GRANT) e não pode delegar permissões.');
  }
}

export type DatabaseInfo = Awaited<ReturnType<typeof inspect>>;

type Backup = ArchiveInfo & { id: string; identity: string; target: string; createdAt: string; sha256: string; bytes: number };

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

const backupIdPattern = /^[0-9]{14}-[a-f0-9]{8}$/;

async function loadBackup(id: string) {
  if (!backupIdPattern.test(id)) throw new SeedError('Use o ID retornado por seed:demo:backup.');
  const directory = await artifactDirectory();
  const root = join(directory, id);
  const file = root + '.jsonl.gz';
  const receipt: Backup = JSON.parse(await readFile(root + '.json', 'utf8'));
  const fileInfo = await stat(file);
  if (receipt.id !== id || !Array.isArray(receipt.tables) || new Set(receipt.tables).size !== receipt.tables.length ||
    !receipt.tables.every((name) => expectedTables.has(name)) ||
    ![...applicationTables, '_prisma_migrations'].every((name) => receipt.tables.includes(name)) ||
    typeof receipt.hasStateRows !== 'boolean' || (receipt.hasStateRows && !receipt.tables.includes(stateTable)) ||
    !fileInfo.isFile() || fileInfo.size !== receipt.bytes || fileInfo.size === 0 ||
    (process.platform !== 'win32' && Boolean(fileInfo.mode & 0o077)) ||
    await hashFile(file) !== receipt.sha256) {
    throw new SeedError('Recibo ou arquivo de backup inválido.');
  }
  return { file, receipt };
}

export async function verifyBackup(target: Target, info: DatabaseInfo, id: string) {
  try {
    const { file, receipt } = await loadBackup(id);
    const age = Date.now() - Date.parse(receipt.createdAt);
    if (receipt.target !== target.label || receipt.identity !== info.identity ||
      JSON.stringify(receipt.tables) !== JSON.stringify(info.tables) || !(age >= 0 && age <= 24 * 60 * 60 * 1000)) {
      throw new Error('Recibo de outro destino ou fora da janela.');
    }
    await readArchive(file, { ...info, hasStateRows: info.hasStateRows || receipt.hasStateRows });
    return receipt;
  } catch {
    throw new SeedError('Backup ausente, vencido, incompleto ou de outro destino. Gere um novo backup verificado.');
  }
}

export async function backup(target: Target, info: DatabaseInfo) {
  const directory = await artifactDirectory();
  const started = new Date();
  const id = `${started.toISOString().slice(0, 19).replace(/\D/g, '')}-${randomUUID().slice(0, 8)}`;
  const root = join(directory, id);
  const file = root + '.jsonl.gz';
  const connection = await createConnection(connectionOptions(target));
  let created = false;
  let receiptWritten = false;
  try {
    const data = archive(connection, async () => {
      const current = await inspect(reader(connection), target);
      if (current.identity !== info.identity || JSON.stringify(current.tables) !== JSON.stringify(info.tables)) {
        throw new SeedError('O destino mudou durante o backup.');
      }
      return current;
    });
    const output = await open(file, 'wx', 0o600);
    created = true;
    await pipeline(Readable.from(data), createGzip(), output.createWriteStream());
    const receipt: Backup = {
      id, identity: info.identity, target: info.target, tables: info.tables, hasStateRows: info.hasStateRows,
      createdAt: started.toISOString(), sha256: await hashFile(file), bytes: (await stat(file)).size,
    };
    await writeFile(root + '.json', JSON.stringify(receipt, null, 2), { flag: 'wx', mode: 0o600 });
    receiptWritten = true;
    return { ...await verifyBackup(target, info, id), file };
  } catch {
    if (created) await rm(file, { force: true });
    if (receiptWritten) await rm(root + '.json', { force: true });
    throw new SeedError('Não foi possível gerar um backup completo e consistente. Verifique o destino, os tipos de coluna e o espaço disponível.');
  } finally {
    // Closing the dedicated connection also rolls back an interrupted read-only snapshot.
    await connection.end();
  }
}

export async function restore(url: string, confirm: string, id: string) {
  const parsed = parseTarget(url);
  if (!parsed.local || !/^arthere_restore_[a-z0-9_]{1,40}$/.test(parsed.database) || confirm !== parsed.database) {
    throw new SeedError('Restauração permitida apenas em schema local descartável arthere_restore_*, com confirmação explícita.');
  }
  const { file, receipt } = await loadBackup(id);
  await readArchive(file, receipt);
  const target = { ...parsed, primary: false, allowExistingAccount: false, label: `${parsed.host}:${parsed.port}/${parsed.database}` };
  const connection = await createConnection(connectionOptions(target));
  try {
    await assertScopedGrants(reader(connection), target.database);
    const counts = await restoreArchive(connection, file, receipt);
    return { status: 'restaurado e verificado', destino: target.label, backup: id, counts };
  } finally {
    await connection.end();
  }
}
