import { Client } from 'pg';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';

config();

const sslEnabled = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

export const createDbClient = () => {
  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: sslEnabled
      ? {
          rejectUnauthorized: true,
          ca: readFileSync(path.resolve(process.cwd(), 'global-bundle.pem')).toString(),
        }
      : { rejectUnauthorized: false },
  });
};
