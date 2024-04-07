
import type { Config } from "drizzle-kit";
import 'dotenv/config';

export default {
    schema: "./src/db/schema.ts",
    out: './migration',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DB_URL!,
    },
  strict: false,

} satisfies Config;