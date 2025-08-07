export function useRandomDatabase() {
  const randomDBName = `test_db_${Math.random().toString(36).substring(2, 15)}`;
  const envFile = Deno.readTextFileSync(import.meta.dirname + "/../../server/.env.development");
  const databaseUrl = envFile
    .split("\n")
    .find((line) => line.startsWith("DATABASE_URL="))
    ?.split("=")[1]
    ?.replace(/['"]/g, "")
    ?.trim();
  const randomDBUrl = databaseUrl!.replace(/(.*\/)(.*)$/, `$1${randomDBName}`);

  // Set the environment variable for the database URL
  Deno.env.set("DATABASE_URL", randomDBUrl);

  const createDatabase = async () => {
    const createDbCommand = [
      "compose",
      "exec",
      "postgres-db",
      "psql",
      "-U",
      "postgres",
      "-c",
      `CREATE DATABASE ${randomDBName}`,
    ];
    await new Deno.Command("docker", { args: createDbCommand }).output();
    await new Deno.Command("deno", {
      args: ["run", "-A", "npm:prisma", "db", "push", "--skip-generate"],
      cwd: import.meta.dirname + "/../../server",
    }).output();
  };

  const dropDatabase = async () => {
    const dropDbCommand = [
      "compose",
      "exec",
      "postgres-db",
      "psql",
      "-U",
      "postgres",
      "-c",
      `DROP DATABASE ${randomDBName} with (FORCE)`,
    ];
    await new Deno.Command("docker", { args: dropDbCommand }).output();
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
