import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const demoDirectory = mkdtempSync(join(tmpdir(), 'globetrotter-demo-'));
const databasePath = join(demoDirectory, 'demo.db');
const environment = { ...process.env, DATABASE_URL: `file:${databasePath}` };
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(script) {
  const result = spawnSync(npmCommand, ['run', script], {
    cwd: process.cwd(),
    env: environment,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`${script} failed while verifying the clean demo database.`);
  }
}

try {
  run('db:migrate');
  run('db:seed');

  const database = new Database(databasePath, { readonly: true });
  const count = (table) => database.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
  const cityCount = count('City');
  const activityCount = count('Activity');
  const distinctActivityCount = database.prepare('SELECT COUNT(DISTINCT name) AS total FROM Activity').get().total;
  const imageGapCount = database.prepare("SELECT COUNT(*) AS total FROM Activity WHERE imageUrl IS NULL OR TRIM(imageUrl) = ''").get().total;
  const incompleteCityCount = database.prepare("SELECT COUNT(*) AS total FROM City WHERE slug IS NULL OR TRIM(slug) = '' OR description IS NULL OR TRIM(description) = '' OR latitude IS NULL OR longitude IS NULL OR bestSeason IS NULL OR idealDays IS NULL OR dailyBudget IS NULL").get().total;
  const westernTripCount = database.prepare("SELECT COUNT(*) AS total FROM Trip WHERE publicId = 'demo-western-india'").get().total;
  const europeanTripCount = database.prepare("SELECT COUNT(*) AS total FROM Trip WHERE publicId = 'demo-europe-trip'").get().total;
  database.close();

  const failures = [
    cityCount < 50 && `expected at least 50 cities, found ${cityCount}`,
    activityCount < 300 && `expected at least 300 activities, found ${activityCount}`,
    distinctActivityCount !== activityCount && 'activity names are not unique',
    imageGapCount > 0 && `${imageGapCount} activities have no image`,
    incompleteCityCount > 0 && `${incompleteCityCount} cities lack required editorial or geographic fields`,
    westernTripCount !== 1 && 'Western India demonstration trip is missing',
    europeanTripCount !== 1 && 'European demonstration trip is missing',
  ].filter(Boolean);

  if (failures.length) throw new Error(`Demo data verification failed:\n- ${failures.join('\n- ')}`);
  console.log(`Clean demo verified: ${cityCount} cities, ${activityCount} distinct activities, two published journeys.`);
} finally {
  rmSync(demoDirectory, { recursive: true, force: true });
}
