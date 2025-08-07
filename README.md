# erp-system

Building an ERP system for a local store in public.

## Development

### Prerequisites:

1. [Deno](https://deno.land/manual/getting_started/installation)
2. [Docker](https://docs.docker.com/get-docker/)

### Setup:

3. Install Deps `deno install`
4. Start the database: `docker compose up -d`
5. Generate prisma client `deno task -r prisma:generate`
6. Run migrations: `deno task -r prisma:migrate:dev`

## Running the Application

```sh
deno task dev
```

### Running Tests

1. Run tests: `deno test`
2. Run linting: `deno lint`

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

Both the backend and frontend are deployed on [Deno Deploy](https://deno.com/deploy).
