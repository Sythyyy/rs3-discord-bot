import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Pool } from 'pg';

export async function runMigrations(pool: Pool, migrationsPath: string): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const applied = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const appliedNames = new Set(applied.rows.map((row) => row.filename));
  const migrationFiles = (await readdir(migrationsPath)).filter((name) => name.endsWith('.sql')).sort();

  for (const filename of migrationFiles) {
    if (appliedNames.has(filename)) continue;
    const sql = await readFile(join(migrationsPath, filename), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
