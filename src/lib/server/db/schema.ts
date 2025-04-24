import type { ChartSettingsType } from '@agnosticeng/dv';
import { relations, sql } from 'drizzle-orm';
import {
	check,
	index,
	int,
	primaryKey,
	sqliteTable as table,
	text,
	unique,
	type AnySQLiteColumn
} from 'drizzle-orm/sqlite-core';

export const users = table(
	'users',
	{
		id: int().primaryKey({ autoIncrement: true }),
		externalId: text('external_id').notNull().unique(),
		username: text().notNull().unique(),
		createdAt: int('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: int('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [index('username_idx').on(t.username), index('external_id_idx').on(t.externalId)]
);

export const usersRelations = relations(users, ({ many }) => ({ secrets: many(secrets) }));

export const notebooks = table('notebooks', {
	id: int().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	slug: text().unique().notNull(),
	authorId: int('author_id')
		.references(() => users.id, { onDelete: 'no action' })
		.notNull(),
	visibility: text({ enum: ['private', 'public', 'unlisted'] })
		.notNull()
		.default('unlisted'),
	forkOfId: int('fork_of_id').references((): AnySQLiteColumn => notebooks.id, {
		onDelete: 'set null'
	}),

	createdAt: int('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: int('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	deletedAt: int('deleted_at', { mode: 'timestamp' })
});

export const notebooksRelations = relations(notebooks, ({ one, many }) => ({
	author: one(users, { fields: [notebooks.authorId], references: [users.id] }),
	blocks: many(blocks),
	likes: many(likes),
	tagsToNotebooks: many(tagsToNotebooks),
	forkOf: one(notebooks, { fields: [notebooks.forkOfId], references: [notebooks.id] })
}));

export const blocks = table(
	'blocks',
	{
		id: int().primaryKey({ autoIncrement: true }),
		notebookId: int('notebook_id')
			.references(() => notebooks.id, { onDelete: 'cascade' })
			.notNull(),
		content: text().notNull(),
		type: text({ enum: ['markdown', 'sql'] }).notNull(),
		position: int().notNull(),
		pinned: int({ mode: 'boolean' }).notNull().default(false),

		createdAt: int('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: int('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),

		metadata: text({ mode: 'json' }).$type<ChartSettingsType | { type: 'table' } | null>()
	},
	(t) => [check('position_check', sql`${t.position} >= 0`)]
);

export const blocksRelations = relations(blocks, ({ one }) => ({
	notebook: one(notebooks, { fields: [blocks.notebookId], references: [notebooks.id] })
}));

export const likes = table(
	'likes',
	{
		userId: int('user_id').references(() => users.id),
		notebookId: int('notebook_id').references(() => notebooks.id, { onDelete: 'cascade' }),
		count: int().notNull().default(1),
		createdAt: int('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: int('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [
		primaryKey({ columns: [t.notebookId, t.userId] }),
		check('count_check', sql`${t.count} <= 10 AND ${t.count} > 0`),
		unique('user_notebook_unique').on(t.userId, t.notebookId)
	]
);

export const likesRelations = relations(likes, ({ one }) => ({
	user: one(users, { fields: [likes.userId], references: [users.id] }),
	notebook: one(notebooks, { fields: [likes.notebookId], references: [notebooks.id] })
}));

export const tags = table('tags', {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull().unique(),
	createdAt: int('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const tagsRelations = relations(tags, ({ many }) => ({
	tagsToNotebooks: many(tagsToNotebooks)
}));

export const tagsToNotebooks = table(
	'tags_to_notebooks',
	{
		notebookId: int('notebook_id')
			.references(() => notebooks.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: int('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull()
	},
	(t) => [primaryKey({ columns: [t.notebookId, t.tagId] })]
);

export const tagsToNotebooksRelations = relations(tagsToNotebooks, ({ one }) => ({
	notebook: one(notebooks, { fields: [tagsToNotebooks.notebookId], references: [notebooks.id] }),
	tag: one(tags, { fields: [tagsToNotebooks.tagId], references: [tags.id] })
}));

export const secrets = table(
	'secrets',
	{
		id: int().primaryKey({ autoIncrement: true }),
		name: text().notNull(),
		value: text().notNull(),
		ownerId: int('owner_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: int('created_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: int('updated_at', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(t) => [unique('secrets_name_owner_unique').on(t.name, t.ownerId)]
);

export const secretsRelations = relations(secrets, ({ one }) => ({
	owner: one(users, { fields: [secrets.ownerId], references: [users.id] })
}));
