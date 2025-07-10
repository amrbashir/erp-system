---
applyTo: "**"
---

# Project general coding standards

- All commands should be run from the root of the project.
- Use prettier for formatting by using `pnpm -w format`.
- Linting is done using `pnpm -w lint`.
- Tests are ran using `pnpm -w test`.
- Sdk generation is done using `pnpm -w sdk build`.
- Database migrations is done using `pnpm -w backend migrate:db:dev`.
- Regenerate the Prisma client using `pnpm -w backend prisma:generate`.
- Don't try to run backend or frontend development, linting is enough.
- Always fix typescript errors, and don't use `any` type.
- Use Prisma transaction (`$transaction`) for operations that modify multiple records.
- Follow NestJS best practices for controller and service organization.
- Ensure all database operations are properly error-handled with appropriate HTTP exceptions.
- Use descriptive variable names and comments for complex business logic.
- Keep code DRY (Don't Repeat Yourself) by extracting common functionality.
- Don't create scripts to modify files and run them, instead modify the files directly.
