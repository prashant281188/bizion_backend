import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';
import * as schema from "../drizzle/schema"
import postgres from 'postgres'

dotenv.config();

const connection = postgres(process.env.DATABASE_URL!)
    export const db = drizzle(connection, { schema });

