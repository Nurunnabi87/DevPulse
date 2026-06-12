import { Pool } from "pg";
import config from "./index";

// A single shared pool: connections are opened once and reused across
// requests instead of paying the TCP + TLS + auth handshake every time.
const pool = new Pool({
  connectionString: config.databaseUrl,
});

export default pool;
