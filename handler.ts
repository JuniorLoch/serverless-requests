import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import express, { json, type NextFunction, type Request, type Response } from 'express';
import serverless from 'serverless-http';

const app = express();

const USERS_TABLE = process.env.USERS_TABLE ?? '';
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(json());

app.get('/', async (_req: Request, res: Response) => {
  res.json({ data: 'Hello world' });
});

app.get('/users/:userId', async (req: Request, res: Response) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const { userId, name } = Item as { userId: string; name: string };
      res.json({ userId, name });
    } else {
      res.status(404).json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not retrieve user' });
  }
});

app.post('/users', async (req: Request, res: Response) => {
  const { userId, name } = req.body as { userId?: unknown; name?: unknown };

  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string' });
    return;
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
    return;
  }

  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name },
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res.json({ userId, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create user' });
  }
});

app.use((_req: Request, res: Response, _next: NextFunction) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

export const handler = serverless(app);
