# Serverless Framework Node Express API on AWS (PostgreSQL + TypeORM)

This project demonstrates how to develop and deploy a Node Express API service, backed by PostgreSQL using TypeORM, running on AWS Lambda with the Serverless Framework.

This template configures a single function, `api`, which is responsible for handling all incoming requests using the `httpApi` event. To learn more about `httpApi` event configuration options, please refer to [httpApi event docs](https://www.serverless.com/framework/docs/providers/aws/events/http-api/). The Express.js framework is responsible for routing and handling requests internally via `serverless-http`.

The Express.js application exposes endpoints to create (`POST /requests`), retrieve (`GET /requests/:id`), and list (`GET /requests`) request records.

## Usage

### Deployment

Install dependencies with:

```bash
npm install
```

and then deploy with:

```bash
serverless deploy
```

After running deploy, you should see output similar to:

```text
Deploying "serverless-requests" to stage "dev" (sa-east-1)

✔ Service deployed to stack serverless-requests-dev (87s)

endpoint: ANY - https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com
functions:
  api: serverless-requests-dev-api (50 MB)
```

### Invocation

#### 1. Create a Request (`POST /requests`)

```bash
curl -X POST "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests" -H "Content-Type: application/json" -d "{\"title\": \"Deploy app\", \"description\": \"Deploy the new application\", \"priority\": \"high\", \"createdBy\": \"john\"}"
```

**Expected Response (201 Created):**

```json
{
  "id": "<request-uuid>",
  "title": "Deploy app",
  "description": "Deploy the new application",
  "priority": "high",
  "createdBy": "john",
  "status": "pending",
  "createdAt": "2026-07-26T01:50:00.000Z"
}
```

#### 2. Retrieve a Request by ID (`GET /requests/:id`)

```bash
curl "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests/<request-uuid>"
```

**Expected Response (200 OK):**

```json
{
  "id": "e4b8a2c1-3d7f-4f8a-9e1b-2c3d4e5f6a7b",
  "title": "Deploy app",
  "description": "Deploy the new application",
  "priority": "high",
  "createdBy": "john",
  "status": "pending",
  "createdAt": "2026-07-26T01:50:00.000Z"
}
```

#### 3. List Requests with Filters (`GET /requests`)

```bash
curl "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests?createdBy=john&status=pending"
```

**Expected Response (200 OK):**

```json
[
  {
    "id": "e4b8a2c1-3d7f-4f8a-9e1b-2c3d4e5f6a7b",
    "title": "Deploy app",
    "description": "Deploy the new application",
    "priority": "high",
    "createdBy": "john",
    "status": "pending",
    "createdAt": "2026-07-26T01:50:00.000Z"
  }
]
```

---

### Local development

To run and test locally using Serverless Framework:

```bash
npm run dev
```

This will start a local emulator of AWS Lambda and tunnel your requests to and from AWS Lambda.
