export function useRandomDatabase() {
  const randomDBName = `test_db_${Math.random().toString(36).substring(2, 15)}`;
  const randomDBUrl = Deno.env.get("DATABASE_URL")!.replace(/(.*\/)(.*)$/, `$1${randomDBName}`);

  // Set the environment variable for the database URL
  Deno.env.set("DATABASE_URL", randomDBUrl);

  const createDatabase = async () => {
    const createDbCommand = `docker compose exec postgres-db psql -U postgres -c "CREATE DATABASE ${randomDBName}"`;
    await new Deno.Command(createDbCommand).output();
    await new Deno.Command("pnpm prisma migrate reset --force").output();
  };

  const dropDatabase = async () => {
    const dropDbCommand = `docker compose exec postgres-db psql -U postgres -c "DROP DATABASE ${randomDBName} with (FORCE)"`;
    await new Deno.Command(dropDbCommand).output();
  };

  return {
    createDatabase,
    dropDatabase,
    randomDBName,
    randomDBUrl,
  };
}

// Helper function to generate random organization names and slugs
export function generateRandomOrgData() {
  const randomId = Math.random().toString(36).substring(2, 8);
  return {
    name: `Test Organization ${randomId}`,
    slug: `test-org-${randomId}`,
    username: "admin",
    password: "12345678",
  };
}
