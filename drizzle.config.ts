
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();
 
export default {
  driver: "mysql2",
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    user: "root",
    password: "",
    host: "127.0.0.1",
    port: 3306,
    database: "drizzle_db",
  }
} satisfies Config;