import { fileURLToPath } from 'node:url';

import { loadEnvironment } from '../config/env.js';
import { createDatabase } from '../infrastructure/database/database.js';
import { runMigrations } from '../infrastructure/database/migrations.js';

const env = loadEnvironment();
const database = createDatabase(env.DATABASE_URL);
const migrationsPath = fileURLToPath(new URL('../../db/migrations', import.meta.url));

try {
  await runMigrations(database, migrationsPath);
  console.log('Migrations complete.');
} finally {
  await database.end();
}
