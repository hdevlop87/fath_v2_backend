import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from './schema';
import postgres from "postgres";
import 'dotenv/config';

const sql = postgres(process.env.DB_URL!); 

export const db = drizzle(sql,{schema});


    