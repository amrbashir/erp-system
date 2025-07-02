# erp-system

Building an ERP system for a local store in public.

## Development

### Prerequisites:

1. Node.js
2. Docker

### Setup:

3. Install dependencies: `pnpm install`
4. Start the database: `docker compose up -d`
5. Run migrations: `pnpm -w backend migrate:db:dev`
6. Build utilities: `pnpm -w build:utils`

## Running the Application

1. Start the backend: `pnpm -w backend dev`
2. Start the web application: `pnpm -w web dev`

### Running Tests

1. Run tests: `pnpm -w test`
2. Run linting: `pnpm -w lint`

## Architecture

The erp-system is structured into multiple packages:

- **`packages/backend`**: A RESTful API using Node.js, Nest.js, PostgresSQL (through Prisma) and deployed on AWS ECS Fargate, check out the [deployment guide](packages/backend/deployment/README.md) for more details.
- **`packages/web`**: A web application built using Vite, React, shadcn/ui, Tailwind CSS, Tanstack Router, Tanstack Query and Tanstack Form
- **`packages/sdk`**: A typed and fetch-based client to communicate with the backend, generated from the openapi spec provided by NestJS swagger integration.
- **`packages/utils`**: A common set of utilities between the backend and frontend.
