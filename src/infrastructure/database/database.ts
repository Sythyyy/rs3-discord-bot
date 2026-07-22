import { Pool, type PoolClient } from 'pg';

export type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export function createDatabase(connectionString: string): Pool {
  return new Pool({ connectionString, max: 10 });
}
export async function withTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await work(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
