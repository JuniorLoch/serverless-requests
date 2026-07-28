# API Node Express com Serverless Framework na AWS (RDS PostgreSQL + TypeORM)

Este projeto demonstra uma implementacao de um serviço de API Node.js com Express, utilizando o RDS da amazon com PostgreSQL via TypeORM, executado a api no AWS Lambda através do Serverless Framework.

Esta estrutura configura 5 funções Lambda dedicadas (`healthCheck`, `createRequest`, `getRequestById`, `listRequests` e `completeRequest`), responsáveis por manipular as requisições HTTP através do evento `httpApi`. O framework Express.js é responsável pelo roteamento e tratamento interno das requisições via `serverless-http`.

A aplicação expõe endpoints para checagem de saúde (`GET /`), criar (`POST /requests`), buscar por ID (`GET /requests/:id`), listar (`GET /requests`) e marcar como concluída (`PATCH /requests/:id/complete`) registros de solicitações.

## Como Usar

### Requerimentos iniciais

Para poder executar esse projeto, primeiramente você precisa ter criado no serviço da AWS
um banco de dados do RDS (o projeto está pré-configurado para postgreSQL) e preencher as
variáveis de ambiente com os dados de acesso ao banco de dados e à VPC.

> **Importante**: Vale lembrar que, para rodar as migrações e o modo desenvolvedor num ambiente local
> você deve primeiramente deixar seu banco de dados liberado ao público e também adicionar
> uma permissão para o seu IP local acessar o banco de dados nas configurações do seu
> `security-group` associado, crie uma **inbound rule**, adicione como tipo postgreSQL e
> coloque o source como my-ip

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

### Migração do Banco de Dados

Antes do primeiro deploy, é necessário criar a tabela `requests` no banco de dados PostgreSQL. Você pode fazer isso de duas formas:

**Opção 1 — Localmente via npm** :

```bash
npm run migration:run
```

Para reverter a última migração, caso necessário:

```bash
npm run migration:revert
```

**Opção 2 — Via GitHub Actions** :

1. Acesse o repositório no GitHub.
2. Vá em **Actions** → **Run Database Migrations**.
3. Clique em **Run workflow** e confirme.

> A action usará as secrets configuradas no repositório para se conectar ao banco de dados RDS e executar as migrações automaticamente.

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
  PATCH - https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests/{id}/complete
functions:
  healthCheck: serverless-requests-dev-healthCheck (15 MB)
  createRequest: serverless-requests-dev-createRequest (15 MB)
  getRequestById: serverless-requests-dev-getRequestById (15 MB)
  listRequests: serverless-requests-dev-listRequests (15 MB)
  completeRequest: serverless-requests-dev-completeRequest (15 MB)
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

#### 4. Marcar Solicitação como Concluída (`PATCH /requests/:id/complete`)

```bash
curl -X PATCH "https://i5ic2tydb1.execute-api.sa-east-1.amazonaws.com/requests/<request-uuid>/complete"
```

**Resposta Esperada (200 OK):**

```json
{
  "id": "e4b8a2c1-3d7f-4f8a-9e1b-2c3d4e5f6a7b",
  "title": "Deploy app",
  "description": "Deploy the new application",
  "priority": "high",
  "createdBy": "john",
  "status": "completed",
  "createdAt": "2026-07-26T01:50:00.000Z"
}
```

**Resposta quando não encontrada (404 Not Found):**

```json
{
  "error": "Request not found"
}
```

---

### Desenvolvimento Local

Para executar e testar localmente usando o Serverless Framework:

```bash
npm run dev
```

Isso iniciará um emulador local do AWS Lambda e Serverless Offline para testar suas requisições.
