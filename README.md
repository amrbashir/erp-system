# erp-system

Building an ERP system for a local store in public.

## Development

### Prerequisites:

1. Node.js
2. Docker

### Developing using Docker

1. Install dependencies: `pnpm install`
2. Run the containers: `docker compose up -d`
3. Inspect logs: `docker compose logs -f web backend`

> On Windows and WSL2, File System Watchers may not work correctly with Docker.
> However, the web application will hot-reload on changes thanks to polling based detection.
> Unfortunately, the backend will not hot-reload on changes and requires a manual restart using `docker compose restart backend`.

### Developing without Docker (still using Docker for Database)

1. Install dependencies: `pnpm install`
2. Start the database: `docker compose up -d postgres-db`
3. Run migrations: `cd packages/backend && pnpm prisma migrate dev`
4. Build utilities: `pnpm -w build:utils`
5. Start the backend: `pnpm -w backend dev`
6. Start the web application: `pnpm -w web dev`

### Running Tests

1. Run tests: `pnpm -w test`
2. Run linting: `pnpm -w lint`

## Architecture

The erp-system is structured into multiple packages:

- **`packages/backend`**: A RESTful API using Node.js, Nest.js, PostgresSQL (through Prisma)
- **`packages/web`**: A web application built using Vite, React, shadcn/ui, Tailwind CSS, Tanstack Router, Tanstack Query and Tanstack Form
- **`packages/sdk`**: A typed and fetch-based client to communicate with the backend, generated from the openapi spec provided by NestJS swagger integration.
- **`packages/utils`**: A common set of utilities between the backend and frontend.
