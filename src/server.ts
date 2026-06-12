import app from "./app";
import config from "./config";
import pool from "./config/db";

const startServer = async (): Promise<void> => {
  try {
    // Fail fast if the database is unreachable
    await pool.query("SELECT 1");
    console.log("✅ Database connected");

    app.listen(config.port, () => {
      console.log(`🚀 DevPulse server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
