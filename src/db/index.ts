import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema"

 
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});
 

const main = async() => {
  console.log("DB CONNECTION IS RUNNING");  
}
main()

export const db = drizzle(poolConnection, { schema, mode: 'default' });