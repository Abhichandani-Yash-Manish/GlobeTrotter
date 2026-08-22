import 'dotenv/config';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const configuredUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

if (!configuredUrl.startsWith('file:')) {
  throw new Error('GlobeTrotter expects a local SQLite DATABASE_URL beginning with file:.');
}

const databasePath = resolve(configuredUrl.slice('file:'.length));
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.close();

console.log(`SQLite database ready at ${databasePath}`);
