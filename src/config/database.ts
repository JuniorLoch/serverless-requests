import { DataSource } from 'typeorm';
import { Request } from '../models/requests/entity/request';
import { CreateRequestsTable1785213817600 } from '../migrations/1785213817600-CreateRequestsTable';

const isSslEnabled = process.env.DB_SSL !== 'false';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  entities: [Request],
  migrations: [CreateRequestsTable1785213817600],
  synchronize: false,
  logging: false,
  ssl: isSslEnabled
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      }
    : false,
});
