import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
import postgres from "postgres";
import { ENV } from "./env";

const connection = postgres(ENV.DATABASE_URL);
export const db = drizzle(connection, { schema });

