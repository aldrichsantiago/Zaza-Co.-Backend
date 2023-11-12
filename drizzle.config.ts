
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();
 
export default {
  driver: "mysql2",
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || "",
    port: 3306,
    database: process.env.DB_NAME || "",
  }
} satisfies Config;