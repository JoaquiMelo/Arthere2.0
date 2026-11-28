import { createReadStream } from 'node:fs';
import { StringDecoder } from 'node:string_decoder';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import type { Connection } from 'mariadb';
import { sha256 } from './images';

const format = 'arthere-mysql-v1';
const binary = new Set(['binary', 'varbinary', 'tinyblob', 'blob', 'mediumblob', 'longblob']);
const scalar = new Set(['tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'decimal', 'date', 'time', 'datetime', 'timestamp', 'year', 'bit']);
const floating = new Set(['float', 'double']);
const text = new Set(['char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'enum', 'set', 'json']);
const token = /^[a-zA-Z0-9_]+$/;
const hex = /^(?:[a-f0-9]{2})*$/i;
const qualifiedReference = /\bREFERENCES\s+(?:`[^`]+`|[\w$]+)\s*\./i;
const quote = (name: string) => '`' + name.replaceAll('`', '``') + '`';

type Column = { name: string; type: string; charset: string | null; generated: boolean };
type Table = { table: string; ddl: string; columns: Column[] };
type Header = { format: string; identity: string; tables: string[]; sqlMode: string; charset: string; collation: string; version: string };
type Row = (string | number | null)[];
type Total = { count: number; digest: string };
export type ArchiveInfo = { identity: string; tables: string[]; hasStateRows: boolean };

function validColumn(c: Column) {
  return typeof c.name === 'string' && c.name.length > 0 && typeof c.generated === 'boolean' &&
    (text.has(c.type) ? typeof c.charset === 'string' && token.test(c.charset)
      : c.charset === null && (binary.has(c.type) || scalar.has(c.type) || floating.has(c.type)));
}

function validTable(table: Table, name: string) {
  return table.table === name && typeof table.ddl === 'string' &&
    table.ddl.startsWith(`CREATE TABLE ${quote(name)} (`) && !qualifiedReference.test(table.ddl) &&
    Array.isArray(table.columns) && table.columns.every(validColumn) && table.columns.some((c) => !c.generated);
}

async function definition(connection: Connection, table: string): Promise<Table> {
  const [result] = await connection.query(`SHOW CREATE TABLE ${quote(table)}`) as {'Create Table': string}[];
  const fields = await connection.query(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS type, CHARACTER_SET_NAME AS charset,
            COALESCE(GENERATION_EXPRESSION, '') AS expression
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
    [table],
  ) as (Omit<Column, 'generated'> & { expression: string })[];
  const entry = {
    table, ddl: result['Create Table'],
    columns: fields.map(({ name, type, charset, expression }) => ({ name, type,
      charset: type === 'json' ? 'utf8mb4' : charset, generated: Boolean(expression) })),
  };
  if (!validTable(entry, table)) throw new Error('Estrutura ou tipo de coluna incompatível com o backup.');
  return entry;
}

function encodeColumn(c: Column) {
  const name = quote(c.name);
  if (c.charset || binary.has(c.type)) return `HEX(${name})`;
  if (c.type === 'bit') return `CAST(CAST(${name} AS UNSIGNED) AS CHAR)`;
  return floating.has(c.type) ? name : `CAST(${name} AS CHAR)`;
}

function decodeColumn(c: Column) {
  if (c.charset) return `CONVERT(UNHEX(?) USING ${c.charset})`;
  if (binary.has(c.type)) return 'UNHEX(?)';
  if (c.type === 'bit') return 'CAST(? AS UNSIGNED)';
  return '?';
}

function validRow(row: unknown, table: Table): row is Row {
  return Array.isArray(row) && row.length === table.columns.length && table.columns.every((c, index) => {
    const value = row[index];
    if (value === null) return true;
    if (floating.has(c.type)) return typeof value === 'number' && Number.isFinite(value);
    return typeof value === 'string' && (!(c.charset || binary.has(c.type)) || hex.test(value));
  });
}

function tally() {
  let count = 0;
  let sum = 0n;
  return {
    add(row: Row) {
      count++;
      // A multiset checksum also works for tables without primary keys or stable scan order.
      sum = BigInt.asUintN(256, sum + BigInt('0x' + sha256(JSON.stringify(row))));
    },
    result: (): Total => ({ count, digest: sum.toString(16).padStart(64, '0') }),
  };
}

async function* rows(connection: Connection, table: Table) {
  const sql = `SELECT ${table.columns.map(encodeColumn).join(', ')} FROM ${quote(table.table)}`;
  for await (const row of connection.queryStream({ sql, rowsAsArray: true })) {
    if (!validRow(row, table)) throw new Error('Valor incompatível com o backup.');
    yield row;
  }
}

const line = (value: unknown) => JSON.stringify(value) + '\n';

export async function* archive(connection: Connection, inspect: () => Promise<ArchiveInfo>) {
  await connection.query("SET SESSION time_zone = '+00:00'");
  await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  const info = await inspect();
  // Hold metadata locks until the final schema check and commit.
  for (const table of info.tables) await connection.query(`SELECT 1 FROM ${quote(table)} LIMIT 0`);
  await verifyRelations(connection);
  const [settings] = await connection.query(`SELECT @@session.sql_mode AS sqlMode, VERSION() AS version,
    DEFAULT_CHARACTER_SET_NAME AS charset, DEFAULT_COLLATION_NAME AS collation
    FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()`) as Omit<Header, 'format' | 'identity' | 'tables'>[];
  yield line({ format, identity: info.identity, tables: info.tables, ...settings });
  for (const name of info.tables) {
    const table = await definition(connection, name);
    yield line(table);
    const total = tally();
    for await (const row of rows(connection, table)) {
      total.add(row);
      yield line(row);
    }
    yield line(total.result());
  }
  const end = await inspect();
  if (end.identity !== info.identity || JSON.stringify(end.tables) !== JSON.stringify(info.tables)) {
    throw new Error('Estrutura mudou durante o backup.');
  }
  await connection.commit();
  yield line({ complete: true });
}

type Hooks = {
  header?: (header: Header) => Promise<void>;
  table?: (table: Table) => Promise<void>;
  row?: (row: Row) => Promise<void>;
  endTable?: (table: Table, total: Total) => Promise<void>;
};

async function* decodedLines(stream: AsyncIterable<Buffer>) {
  const decoder = new StringDecoder('utf8');
  let pending = '';
  for await (const chunk of stream) {
    const lines = (pending + decoder.write(chunk)).split('\n');
    pending = lines.pop()!;
    yield* lines;
  }
  pending += decoder.end();
  if (pending) yield pending;
}

export async function readArchive(path: string, expected: ArchiveInfo, hooks: Hooks = {}) {
  let header = false;
  let table: Table | undefined;
  let total = tally();
  let completed = 0;
  let done = false;
  await pipeline(createReadStream(path), createGunzip(), async (stream) => {
    for await (const source of decodedLines(stream)) {
      const record = JSON.parse(source);
      if (done) throw new Error('Dados depois do final do backup.');
      if (!header) {
        if (record.format !== format || record.identity !== expected.identity
          || JSON.stringify(record.tables) !== JSON.stringify(expected.tables)
          || typeof record.version !== 'string' || typeof record.sqlMode !== 'string'
          || !/^[A-Z_,]*$/.test(record.sqlMode) || !token.test(record.charset) || !token.test(record.collation)) {
          throw new Error('Cabeçalho incompatível com o destino.');
        }
        header = true;
        await hooks.header?.(record);
      } else if (table) {
        if (Array.isArray(record)) {
          if (!validRow(record, table)) throw new Error('Registro inválido no backup.');
          total.add(record);
          await hooks.row?.(record);
        } else {
          const actual = total.result();
          if (actual.count !== record.count || actual.digest !== record.digest
            || (table.table === 'arthere_state' && expected.hasStateRows && !actual.count)) {
            throw new Error('Integridade dos registros inválida no backup.');
          }
          await hooks.endTable?.(table, actual);
          table = undefined;
          completed++;
        }
      } else if (completed === expected.tables.length) {
        if (record.complete !== true) throw new Error('Final inválido.');
        done = true;
      } else {
        if (!validTable(record, expected.tables[completed])) throw new Error('Estrutura de tabela inválida no backup.');
        table = record;
        total = tally();
        await hooks.table?.(record);
      }
    }
  });
  if (!done) throw new Error('Backup incompleto.');
}

export async function restoreArchive(connection: Connection, path: string, expected: ArchiveInfo) {
  const [server] = await connection.query('SELECT DATABASE() AS name, VERSION() AS version') as { name: string; version: string }[];
  if (!/^arthere_restore_[a-z0-9_]+$/.test(server.name)) throw new Error('Use um schema descartável arthere_restore_*.');

  const existing = await connection.query(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()
    UNION ALL SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()
    UNION ALL SELECT EVENT_NAME FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()`);
  if (existing.length) throw new Error('O schema de restauração precisa estar vazio.');
  await connection.query("SET SESSION time_zone = '+00:00'");
  await connection.query('SET SESSION foreign_key_checks = 0');
  const checks: { table: Table; total: Total }[] = [];
  const counts: Record<string, number> = {};
  let insert = '';
  let writable: number[] = [];

  try {
    await readArchive(path, expected, {
      async header(header) {
        if (header.version !== server.version) throw new Error('Use a mesma versão do servidor de origem.');
        await connection.query(`ALTER DATABASE ${quote(server.name)} CHARACTER SET ${header.charset} COLLATE ${header.collation}`);
        const mode = [...new Set([...header.sqlMode.split(',').filter(Boolean), 'NO_AUTO_VALUE_ON_ZERO'])].join(',');
        await connection.query('SET SESSION sql_mode = ?', [mode]);
      },
      async table(table) {
        await connection.query(table.ddl);
        writable = table.columns.flatMap((c, index) => c.generated ? [] : [index]);
        const fields = writable.map((index) => table.columns[index]);
        insert = `INSERT INTO ${quote(table.table)} (${fields.map(({ name }) => quote(name)).join(', ')}) VALUES (${fields.map(decodeColumn).join(', ')})`;
        await connection.beginTransaction();
      },
      async row(row) {
        await connection.execute(insert, writable.map((index) => row[index]));
      },
      async endTable(table, total) {
        await connection.commit();
        checks.push({ table, total });
        counts[table.table] = total.count;
      },
    });
    // MySQL may print the implied charset explicitly after replaying a column collation.
    const normalizeDdl = (ddl: string) => ddl.replace(/ CHARACTER SET ([a-z0-9]+) COLLATE ([a-z0-9_]+)/ig,
      (clause, charset: string, collation: string) => collation.toLowerCase().startsWith(charset.toLowerCase() + '_')
        ? ' COLLATE ' + collation : clause);
    for (const check of checks) {
      const actual = await definition(connection, check.table.table);
      if (normalizeDdl(actual.ddl) !== normalizeDdl(check.table.ddl) || JSON.stringify(actual.columns) !== JSON.stringify(check.table.columns)) {
        throw new Error('Estrutura restaurada diverge do backup.');
      }
      const total = tally();
      for await (const row of rows(connection, actual)) total.add(row);
      if (JSON.stringify(total.result()) !== JSON.stringify(check.total)) throw new Error('Dados restaurados divergem do backup.');
    }
    await verifyRelations(connection);
    return counts;
  } finally {
    await connection.rollback();
    await connection.query('SET SESSION foreign_key_checks = 1');
  }
}

async function verifyRelations(connection: Connection) {
  type Relation = { constraintName: string; tableName: string; columnName: string; parentTable: string; parentColumn: string };
  const relations = await connection.query(`SELECT CONSTRAINT_NAME AS constraintName, TABLE_NAME AS tableName,
    COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS parentTable, REFERENCED_COLUMN_NAME AS parentColumn
    FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_SCHEMA = DATABASE()`) as Relation[];
  const groups = new Map<string, Relation[]>();
  for (const relation of relations) {
    const id = JSON.stringify([relation.tableName, relation.constraintName]);
    const set = groups.get(id) ?? [];
    set.push(relation);
    groups.set(id, set);
  }
  for (const fields of groups.values()) {
    const { tableName, parentTable } = fields[0];
    const matches = fields.map(({ columnName, parentColumn }) => `p.${quote(parentColumn)} = c.${quote(columnName)}`);
    const present = fields.map(({ columnName }) => `c.${quote(columnName)} IS NOT NULL`);
    const orphan = await connection.query(`SELECT 1 FROM ${quote(tableName)} c WHERE ${present.join(' AND ')}
      AND NOT EXISTS (SELECT 1 FROM ${quote(parentTable)} p WHERE ${matches.join(' AND ')}) LIMIT 1`);
    if (orphan.length) throw new Error('O esquema contém registros órfãos em uma chave estrangeira.');
  }
}
