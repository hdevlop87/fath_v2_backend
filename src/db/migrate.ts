import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const sql = postgres(process.env.DB_URL);
const db = drizzle(sql);



(async () => {
    await migrate(db, { migrationsFolder: './drizzle' });
})();