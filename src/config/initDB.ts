import pool from "./db";

/**
 * One-time database initializer.
 * Creates the users and issues tables with all constraints
 * required by the assignment specification.
 *
 * Run with: npm run db:init
 */
const initDB = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        VARCHAR(20) NOT NULL DEFAULT 'contributor'
                  CHECK (role IN ('contributor', 'maintainer')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(150) NOT NULL,
      description TEXT NOT NULL CHECK (char_length(description) >= 20),
      type        VARCHAR(20) NOT NULL
                  CHECK (type IN ('bug', 'feature_request')),
      status      VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'resolved')),
      -- no FOREIGN KEY by design: reporter existence is validated in app logic
      reporter_id INTEGER NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("✅ Tables 'users' and 'issues' are ready.");
};

initDB()
  .catch((error: unknown) => {
    console.error("❌ Database initialization failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });
