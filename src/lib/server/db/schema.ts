import { sql } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notebooks = sqliteTable('notebooks', {
	id: int().primaryKey({ autoIncrement: true }),
	created_at: text()
		.notNull()
		.default(sql`(datetime('now'))`),
	updated_at: text()
		.notNull()
		.default(sql`(datetime('now'))`),
	deleted_at: text(),
	author: text().notNull(),
	name: text().notNull(),
	contents: text({ mode: 'json' }).$type<string[]>().notNull().default([])
});

export const queries = sqliteTable('queries', {
	id: int().primaryKey({ autoIncrement: true }),
	sql: text().notNull(),
	notebook_id: int().references(() => notebooks.id, { onDelete: 'set null' })
});
