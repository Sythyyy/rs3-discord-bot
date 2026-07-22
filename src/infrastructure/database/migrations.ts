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
  const columns = await pool.query<{ column_name: string }>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'schema_migrations'
      AND column_name IN ('filename', 'name')
  `);
  const migrationNameColumn = columns.rows.some((row) => row.column_name === 'filename')
    ? 'filename'
    : columns.rows.some((row) => row.column_name === 'name')
      ? 'name'
      : null;
  if (!migrationNameColumn) {
    throw new Error('schema_migrations must contain a filename or name column');
  }

  const applied = await pool.query<{ filename: string }>(
    `SELECT ${migrationNameColumn} AS filename FROM schema_migrations`,
  );
  const appliedNames = new Set(applied.rows.map((row) => row.filename));
  const migrationFiles = (await readdir(migrationsPath))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const filename of migrationFiles) {
    if (appliedNames.has(filename)) continue;
    const sql = await readFile(join(migrationsPath, filename), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (${migrationNameColumn}) VALUES ($1)`, [
        filename,
      ]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
