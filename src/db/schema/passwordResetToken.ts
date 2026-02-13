import {
    pgTable,
    uuid,
    text,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import { users } from "./user";

export const passwordResetTokens = pgTable(
    "password_reset_tokens",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .references(() => users.id, {
                onDelete: "cascade",
            })
            .notNull(),

        tokenHash: text("token_hash").notNull(),

        expiresAt: timestamp("expires_at", {
            withTimezone: true,
        }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("reset_user_idx").on(table.userId),
    ]
);
