import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const saves = sqliteTable("saves", {
  code: text("code").primaryKey(),
  data: text("data").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
