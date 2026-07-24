import { DataSource } from 'typeorm';
import { Request } from './entities/Request';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  entities: [Request],
  synchronize: false,
  logging: false,
  ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' ? {
    rejectUnauthorized: false,
  } : false,
});
