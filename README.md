# erp-system

Building an ERP system for a local store in public.

## Development

### Prerequisites:

1. [Deno](https://deno.land/manual/getting_started/installation)
2. [Docker](https://docs.docker.com/get-docker/)

### Setup:

3. Install Deps `deno install`
4. Start docker compose: `docker compose up -d`
5. Generate prisma client `deno task -r prisma:generate`
6. Run database migrations: `deno task -r prisma:migrate:dev`

### Running the Application

```sh
deno task dev
```

### Running Tests

1. Run tests: `deno test`
2. Run linting: `deno lint`

### Tracing

Open the Grafana Dashboard on https://localhost:3000, to view the traces.

## Architecture

The ERP system follows a modern, monorepo-based architecture with clear separation of concerns:

### [Backend](./packages/server/)

- **Framework**: tRPC for type-safe API development.
- **Database**: PostgreSQL with Prisma ORM for type-safe database access.
- **Authentication**: Session-based authentication.

### [Frontend](./packages/web)

- **Framework**: React with Vite for fast development and building.
- **Routing**: TanStack Router for type-safe routing.
- **State Management**: TanStack Query with tRPC for end-to-end type-safe API communication.
- **UI Components**: Shadcn/ui and Tailwind CSS.
- **Internationalization**: i18next for multi-language support (English and Arabic).

### Deployment

- **Backend**: Deployed on [Deno Deploy](https://deno.com/deploy).
- **Frontend**: Deployed as a SPA and served from same instance as backend on [Deno Deploy](https://deno.com/deploy).
- **Database**: Managed PostgreSQL on [Neon](https://neon.tech)

## LICENSE

[MIT](./LICENSE) License
