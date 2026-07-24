import 'reflect-metadata';
import { randomUUID } from 'crypto';
import express, { json, type NextFunction, type Request, type Response } from 'express';
import serverless from 'serverless-http';
import { AppDataSource } from './src/database';
import { Request as RequestEntity } from './src/entities/Request';
import { CreateRequestDto } from './src/dtos/CreateRequestDto';
import { GetRequestsQueryDto } from './src/dtos/GetRequestsQueryDto';
import { validateDto, sendValidationError } from './src/utils/validation';

const app = express();

// Initialize database connection on Lambda startup
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (dbInitialized) {
    console.log('[DB] Already initialized, skipping...');
    return;
  }

  if (!AppDataSource.isInitialized) {
    try {
      console.log('[DB] Initializing TypeORM connection...');
      await AppDataSource.initialize();
      console.log('[DB] ✓ TypeORM connection initialized');
      dbInitialized = true;
    } catch (error) {
      console.error('[DB] ✗ Failed to initialize TypeORM:', error);
      throw error;
    }
  }
};

app.use(json());

app.get('/', async (_req: Request, res: Response) => {
  try {
    console.log('[GET /] Request received');
    await ensureDbInitialized();
    console.log('[GET /] DB initialized');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    const result = await queryRunner.query('SELECT version()');
    await queryRunner.release();

    console.log('[GET /] Sending response');
    res.json({ data: result[0].version, message: 'Database connection successful' });
  } catch (error) {
    console.error('[GET /] ✗ Error:', error);
    console.error('[GET /] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      error: 'Database connection failed',
      details: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/requests', async (req: Request, res: Response) => {
  try {
    await ensureDbInitialized();
    console.log('[POST /requests] Request received:', req.body);

    const validation = await validateDto(CreateRequestDto, req.body);
    if (!validation.isValid) {
      console.log('[POST /requests] Validation failed:', validation.errors);
      sendValidationError(res, validation.errors!);
      return;
    }

    const dto = validation.instance!;
    const repository = AppDataSource.getRepository(RequestEntity);

    const request = repository.create({
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      createdBy: dto.createdBy,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const savedRequest = await repository.save(request);
    console.log('[POST /requests] Request created:', savedRequest.id);

    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('[POST /requests] ✗ Error:', error);
    res.status(500).json({ error: 'Could not create request', details: String(error) });
  }
});

app.get('/requests/:id', async (req: Request, res: Response) => {
  try {
    await ensureDbInitialized();
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    console.log('[GET /requests/:id] Looking for:', id);

    const repository = AppDataSource.getRepository(RequestEntity);
    const request = await repository.findOne({ where: { id } });

    if (!request) {
      console.log('[GET /requests/:id] Request not found');
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    console.log('[GET /requests/:id] Request found');
    res.json(request);
  } catch (error) {
    console.error('[GET /requests/:id] ✗ Error:', error);
    res.status(500).json({ error: 'Could not retrieve request', details: String(error) });
  }
});

app.get('/requests', async (req: Request, res: Response) => {
  try {
    await ensureDbInitialized();
    console.log('[GET /requests] Query params:', req.query);

    const validation = await validateDto(GetRequestsQueryDto, req.query);
    if (!validation.isValid) {
      console.log('[GET /requests] Validation failed:', validation.errors);
      sendValidationError(res, validation.errors!);
      return;
    }

    const query = validation.instance!;
    const repository = AppDataSource.getRepository(RequestEntity);

    const whereConditions: Record<string, any> = {};
    if (query.createdBy) {
      whereConditions.createdBy = query.createdBy;
    }
    if (query.status) {
      whereConditions.status = query.status;
    }

    console.log('[GET /requests] Searching with conditions:', whereConditions);
    const requests = await repository.find({ where: whereConditions });

    console.log('[GET /requests] Found', requests.length, 'requests');
    res.json(requests);
  } catch (error) {
    console.error('[GET /requests] ✗ Error:', error);
    res.status(500).json({ error: 'Could not list requests', details: String(error) });
  }
});

app.use((_req: Request, res: Response, _next: NextFunction) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverless(app);
