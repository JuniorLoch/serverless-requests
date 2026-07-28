# API Node Express com Serverless Framework na AWS (RDS PostgreSQL + TypeORM)

Este projeto demonstra uma implementacao de um serviço de API Node.js com Express, utilizando o RDS da amazon com PostgreSQL via TypeORM, executado a api no AWS Lambda através do Serverless Framework.

Esta estrutura configura 4 funções Lambda dedicadas (`healthCheck`, `createRequest`, `getRequestById` e `listRequests`), responsáveis por manipular as requisições HTTP através do evento `httpApi`. O framework Express.js é responsável pelo roteamento e tratamento interno das requisições via `serverless-http`.

A aplicação expõe endpoints para checagem de saúde (`GET /`), criar (`POST /requests`), buscar por ID (`GET /requests/:id`) e listar (`GET /requests`) registros de solicitações.

## Como Usar

### Deploy

Instale as dependências com:

```bash
npm install
```

Crie o arquivo de variáveis de ambiente a partir do modelo de exemplo:

```bash
cp .env.example .env
```

> **Nota**: Abra o arquivo `.env` criado e preencha as variáveis de ambiente com os dados corretos de acesso ao seu banco de dados e VPC.

E em seguida faça o deploy com:

```bash
npm run deploy
```

Após executar o deploy, você verá uma saída semelhante a:

```text
Deploying "serverless-requests" to stage "dev" (sa-east-1)

✔ Service deployed to stack serverless-requests-dev (87s)

endpoints:
  GET - https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/
  POST - https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests
  GET - https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests/{id}
  GET - https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests
functions:
  healthCheck: serverless-requests-dev-healthCheck (15 MB)
  createRequest: serverless-requests-dev-createRequest (15 MB)
  getRequestById: serverless-requests-dev-getRequestById (15 MB)
  listRequests: serverless-requests-dev-listRequests (15 MB)
```

### Exemplos de Uso

#### 1. Criar uma Solicitação (`POST /requests`)

```bash
curl -X POST "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests" -H "Content-Type: application/json" -d "{\"title\": \"Deploy app\", \"description\": \"Deploy the new application\", \"priority\": \"high\", \"createdBy\": \"john\"}"
```

**Resposta Esperada (201 Created):**

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

#### 2. Buscar Solicitação por ID (`GET /requests/:id`)

```bash
curl "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests/<request-uuid>"
```

**Resposta Esperada (200 OK):**

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

#### 3. Listar Solicitações com Filtros (`GET /requests`)

```bash
curl "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests?createdBy=john&status=pending"
```

**Resposta Esperada (200 OK):**

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

### Desenvolvimento Local

Para executar e testar localmente usando o Serverless Framework:

```bash
npm run dev
```

Isso iniciará um emulador local do AWS Lambda e Serverless Offline para testar suas requisições.
