import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

function createRemoteClient(url: string) {
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is configured.');
  }

  return new PrismaClient({
    adapter: new PrismaLibSql({ url, authToken }),
  });
}

function createLocalClient(url: string) {
  if (url !== ':memory:' && !url.startsWith('file:')) {
    throw new Error('Local GlobeTrotter databases must use a file: SQLite URL or :memory:.');
  }

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
  });
}

export function createPrismaClient() {
  const localUrl = process.env.DATABASE_URL?.trim();
  if (localUrl) return createLocalClient(localUrl);

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  return tursoUrl ? createRemoteClient(tursoUrl) : createLocalClient('file:./prisma/dev.db');
}
