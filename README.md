# erp-system

Building an ERP system for a local store in public.

## Archeticture

### `packages/backend`

A RESTful API using Node.js, Nest.js, PostgresSQL (through Prisma)

### `packages/web`

A web application built using Vite, React, shadcn/ui, Tailwind CSS, Tanstack Router, Tanstack Query and Tanstack Form

### `packages/sdk`

A typed and fetch-based client to communicate with the backend, generated from the openapi spec provided by NestJS swagger integration.

### `packages/utils`

A common set of utilities between the backend and frontend.
