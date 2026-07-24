import { randomUUID } from 'crypto';
import express, { json, type NextFunction, type Request, type Response } from 'express';
import serverless from 'serverless-http';
import { createDbClient } from './src/db';

const app = express();

type RequestItem = {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
};

const PRIORITY_VALUES = ['low', 'medium', 'high'] as const;
const STATUS_VALUES = ['pending', 'in_progress', 'completed'] as const;

const isValidPriority = (value: unknown): value is RequestItem['priority'] => {
  return typeof value === 'string' && PRIORITY_VALUES.includes(value as RequestItem['priority']);
};

const isValidStatus = (value: unknown): value is RequestItem['status'] => {
  return typeof value === 'string' && STATUS_VALUES.includes(value as RequestItem['status']);
};

const withDbClient = async <T>(handler: (client: Awaited<ReturnType<typeof createDbClient>>) => Promise<T>) => {
  const client = createDbClient();
  try {
    await client.connect();
    return await handler(client);
  } finally {
    await client.end();
  }
};

// Initialize database table on Lambda startup
let dbInitialized = false;
const initializeDb = async () => {
  if (dbInitialized) {
    console.log('[DB] Already initialized, skipping...');
    return;
  }
  try {
    console.log('[DB] Starting initialization...');
    console.log('[DB] Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED,
    });

    await withDbClient(async (client) => {
      console.log('[DB] Connected to database');
      await client.query(`
        CREATE TABLE IF NOT EXISTS requests (
          id UUID PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
          created_by TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
          created_at TEXT NOT NULL
        )
      `);
      console.log('[DB] Table created or already exists');
    });
    dbInitialized = true;
    console.log('[DB] ✓ Database table initialized successfully');
  } catch (error) {
    console.error('[DB] ✗ Failed to initialize database:', error);
    throw error;
  }
};

// Initialize on first request
let initPromise: Promise<void> | null = null;
const ensureDbInitialized = async () => {
  if (!initPromise) {
    initPromise = initializeDb();
  }
  await initPromise;
};

app.use(json());

app.get('/', async (_req: Request, res: Response) => {
  try {
    console.log('[GET /] Request received');

    console.log('[GET /] Ensuring DB initialized...');
    await ensureDbInitialized();
    console.log('[GET /] DB initialized');

    console.log('[GET /] Executing query: SELECT version()');
    const result = await withDbClient(async (client) => {
      const queryResult = await client.query('SELECT version()');
      console.log('[GET /] Query result:', queryResult.rows);
      return queryResult;
    });

    console.log('[GET /] Sending response');
    res.json({ data: result?.rows[0]?.version, message: 'Database connection successful' });
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

    const payload = req.body as Partial<RequestItem>;
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const description = typeof payload.description === 'string' ? payload.description.trim() : '';
    const priority = payload.priority;
    const createdBy = typeof payload.createdBy === 'string' ? payload.createdBy.trim() : '';

    if (!title) {
      res.status(400).json({ error: '"title" must be a non-empty string' });
      return;
    }

    if (!description) {
      res.status(400).json({ error: '"description" must be a non-empty string' });
      return;
    }

    if (!isValidPriority(priority)) {
      res.status(400).json({ error: '"priority" must be one of: low, medium, high' });
      return;
    }

    if (!createdBy) {
      res.status(400).json({ error: '"createdBy" must be a non-empty string' });
      return;
    }

    const item: RequestItem = {
      id: randomUUID(),
      title,
      description,
      priority,
      createdBy,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await withDbClient(async (client) => {
      await client.query(
        `INSERT INTO requests (id, title, description, priority, created_by, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.id, item.title, item.description, item.priority, item.createdBy, item.status, item.createdAt],
      );
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create request' });
  }
});

app.get('/requests/:id', async (req: Request, res: Response) => {
  try {
    await ensureDbInitialized();
    const result = await withDbClient(async (client) => {
      return client.query('SELECT * FROM requests WHERE id = $1', [req.params.id]);
    });

    if (result.rows.length > 0) {
      res.json(result.rows[0] as RequestItem);
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not retrieve request' });
  }
});

app.get('/requests', async (req: Request, res: Response) => {
  try {
    await ensureDbInitialized();

    const createdBy = typeof req.query.createdBy === 'string' ? req.query.createdBy.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    if (status && !isValidStatus(status)) {
      res.status(400).json({ error: '"status" must be one of: pending, in_progress, completed' });
      return;
    }

    const conditions: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (createdBy) {
      conditions.push(`created_by = $${index}`);
      values.push(createdBy);
      index += 1;
    }

    if (status) {
      conditions.push(`status = $${index}`);
      values.push(status);
      index += 1;
    }

    const query = `SELECT * FROM requests${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`;

    const result = await withDbClient(async (client) => client.query(query, values));
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not list requests' });
  }
});

app.use((_req: Request, res: Response, _next: NextFunction) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverless(app);
