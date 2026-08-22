import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !authToken) {
  throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required. Run `vercel env pull .env.local` first.');
}

const client = createClient({ url, authToken });

async function tableExists(name: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    args: [name],
  });
  return result.rows.length > 0;
}

async function verifySeed() {
  const [cities, activities, journeys] = await Promise.all([
    client.execute('SELECT COUNT(*) AS total FROM City'),
    client.execute('SELECT COUNT(*) AS total FROM Activity'),
    client.execute("SELECT COUNT(*) AS total FROM Trip WHERE publicId IN ('demo-europe-trip', 'demo-western-india')"),
  ]);

  const cityCount = Number(cities.rows[0]?.total ?? 0);
  const activityCount = Number(activities.rows[0]?.total ?? 0);
  const journeyCount = Number(journeys.rows[0]?.total ?? 0);

  if (cityCount < 50 || activityCount < 300 || journeyCount !== 2) {
    throw new Error(`Remote seed verification failed: ${cityCount} cities, ${activityCount} activities, ${journeyCount} showcase journeys.`);
  }

  console.log(`Remote database verified: ${cityCount} cities, ${activityCount} activities, ${journeyCount} showcase journeys.`);
}

async function bootstrap() {
  if (await tableExists('User')) {
    console.log('Remote database is already initialized; no migrations or destructive seed were run.');
    await verifySeed();
    return;
  }

  const migrationsDirectory = join(process.cwd(), 'prisma', 'migrations');
  const migrationNames = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of migrationNames) {
    const sql = await readFile(join(migrationsDirectory, migrationName, 'migration.sql'), 'utf8');
    await client.executeMultiple(sql);
    console.log(`Applied ${migrationName}`);
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const seed = spawnSync(npmCommand, ['run', 'db:seed'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: '' },
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (seed.status !== 0) {
    throw new Error('Remote database migration succeeded, but seeding failed.');
  }

  await verifySeed();
}

bootstrap()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    client.close();
  });
