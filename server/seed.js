require("dotenv").config();

const { ensureDatabase, closeDatabase } = require("./database");

async function main() {
  const result = await ensureDatabase({ seed: true });
  console.log(
    `Database ready. Seeded ${result.topicsSeeded} topics and ${result.usersSeeded} users.`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed database.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeDatabase();
    } catch (error) {
      console.error("Failed to close database connection cleanly.", error);
    }
  });
