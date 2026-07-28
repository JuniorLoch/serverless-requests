import 'reflect-metadata';
import express, { json, type NextFunction, type Request, type Response } from 'express';
import serverless from 'serverless-http';
import { AppDataSource } from './src/config/database';
import { createRequestRouter, getRequestByIdRouter, listRequestsRouter } from './src/models/requests/requests.router';
import { Logger } from '@aws-lambda-powertools/logger';

const ensureDbInitialized = async (_req: Request, _res: Response, next: NextFunction) => {
  const logger = new Logger({ serviceName: '[DB]' });

  if (!AppDataSource.isInitialized) {
    try {
      logger.info('[DB] Initializing TypeORM connection...');
      await AppDataSource.initialize();
      logger.info('[DB] ✓ TypeORM connection initialized');
    } catch (error: any) {
      logger.error('[DB] ✗ Failed to initialize TypeORM:', error);
      next(error);
      return;
    }
  }
  next();
};

const createExpressApp = () => {
  const app = express();
  app.use(json());
  app.use(ensureDbInitialized);
  return app;
};

const healthApp = createExpressApp();

healthApp.get('/', async (_req: Request, res: Response) => {
  const logger = new Logger({ serviceName: '[GET /]' });
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    const result = await queryRunner.query('SELECT version()');
    await queryRunner.release();

    res.json({ data: result[0].version, message: 'Database connection successful' });
  } catch (error: any) {
    logger.error('[GET /] ✗ Error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const healthCheck = serverless(healthApp);

export const createRequest = serverless(createExpressApp().use(createRequestRouter));
export const getRequestById = serverless(createExpressApp().use(getRequestByIdRouter));
export const listRequests = serverless(createExpressApp().use(listRequestsRouter));
