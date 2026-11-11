import sql from 'mssql';
import { requiredSetting } from './config.js';

let poolPromise: Promise<sql.ConnectionPool> | undefined;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool({
      server: requiredSetting('SQL_SERVER'),
      database: requiredSetting('SQL_DATABASE'),
      authentication: { type: 'azure-active-directory-default', options: {} },
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    });
    poolPromise = pool.connect().catch((error: unknown) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

export function isSkuConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'number' in error &&
    (error.number === 2601 || error.number === 2627)
  );
}
