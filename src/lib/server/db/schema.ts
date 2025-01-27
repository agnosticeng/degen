import { relations, sql } from 'drizzle-orm';
import { index, int, sqliteTable as table, text } from 'drizzle-orm/sqlite-core';

export const users = table(
	'users',
	{
		id: int().primaryKey({ autoIncrement: true }),
		providerId: text('provider_id').notNull().unique(),
		username: text().notNull().unique()
	},
	(t) => [index('username_idx').on(t.username)]
);

export const notebooks = table(
	'notebooks',
	{
		id: int().primaryKey({ autoIncrement: true }),
		authorId: int('author_id')
			.notNull()
			.references(() => users.id),
		name: text().notNull(),
		slug: text().notNull().unique(),
		contents: text({ mode: 'json' }).$type<string[]>().notNull().default([]),
		access: text({ enum: ['private', 'public', 'unlisted'] }).default('private'),

		createdAt: int('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: int('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		deletedAt: int('deleted_at', { mode: 'timestamp' })
	},
	(t) => [index('slug_idx').on(t.slug)]
);

export const notebooksRelations = relations(notebooks, ({ one, many }) => ({
	author: one(users, { fields: [notebooks.authorId], references: [users.id] }),
	queries: many(queries)
}));

export const queries = table('queries', {
	id: int().primaryKey({ autoIncrement: true }),
	sql: text().notNull(),
	notebookId: int('notebook_id').references(() => notebooks.id, { onDelete: 'set null' }),

	createdAt: int('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: int('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const queriesRelations = relations(queries, ({ one }) => ({
	notebook: one(notebooks, { fields: [queries.notebookId], references: [notebooks.id] })
}));
