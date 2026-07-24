import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import express, { json, type NextFunction, type Request, type Response } from 'express';
import serverless from 'serverless-http';

const app = express();

const REQUESTS_TABLE = process.env.REQUESTS_TABLE ?? '';
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

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

app.use(json());

app.get('/', async (_req: Request, res: Response) => {
  res.json({ data: 'Hello world' });
});

app.post('/requests', async (req: Request, res: Response) => {
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

  try {
    await docClient.send(new PutCommand({ TableName: REQUESTS_TABLE, Item: item }));
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create request' });
  }
});

app.get('/requests/:id', async (req: Request, res: Response) => {
  try {
    const { Item } = await docClient.send(
      new GetCommand({
        TableName: REQUESTS_TABLE,
        Key: { id: req.params.id },
      }),
    );

    if (Item) {
      res.json(Item as RequestItem);
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not retrieve request' });
  }
});

app.get('/requests', async (req: Request, res: Response) => {
  const createdBy = typeof req.query.createdBy === 'string' ? req.query.createdBy.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  if (status && !isValidStatus(status)) {
    res.status(400).json({ error: '"status" must be one of: pending, in_progress, completed' });
    return;
  }

  const params: {
    TableName: string;
    FilterExpression?: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
  } = { TableName: REQUESTS_TABLE };

  const filterExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  if (createdBy) {
    filterExpressions.push('#createdBy = :createdBy');
    expressionAttributeNames['#createdBy'] = 'createdBy';
    expressionAttributeValues[':createdBy'] = createdBy;
  }

  if (status) {
    filterExpressions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = status;
  }

  if (filterExpressions.length > 0) {
    params.FilterExpression = filterExpressions.join(' AND ');
    params.ExpressionAttributeNames = expressionAttributeNames;
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  try {
    const { Items = [] } = await docClient.send(new ScanCommand(params));
    res.json(Items);
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
