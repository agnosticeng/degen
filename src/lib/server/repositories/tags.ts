import { asc, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { tags, tagsToNotebooks } from '../db/schema';
import type { Notebook } from './notebooks';

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export interface TagRepository {
	all(): Promise<Tag[]>;
	trends(limit?: number): Promise<Tag[]>;
	setTags(notebook: Notebook['id'], tags: NewTag[]): Promise<Tag[]>;
}

class DrizzleTagRepository implements TagRepository {
	constructor(private db: DrizzleDatabase) {}

	async all(): Promise<Tag[]> {
		return await this.db.select().from(tags).orderBy(asc(tags.createdAt));
	}

	async trends(limit: number = 5): Promise<Tag[]> {
		const rows = await this.db
			.select({
				...getTableColumns(tags),
				counts: this.db.$count(tagsToNotebooks, eq(tagsToNotebooks.tagId, tags.id))
			})
			.from(tags)
			.orderBy((t) => desc(t.counts))
			.limit(limit);

		return rows.map(({ counts, ...tag }) => tag);
	}

	async setTags(notebook: Notebook['id'], _tags: NewTag[]): Promise<Tag[]> {
		return await this.db.transaction(async (tx) => {
			const rows = await tx
				.insert(tags)
				.values(_tags)
				.onConflictDoUpdate({
					target: [tags.name],
					set: { name: sql`excluded.name` }
				})
				.returning();

			await tx.delete(tagsToNotebooks).where(eq(tagsToNotebooks.notebookId, notebook));

			await tx
				.insert(tagsToNotebooks)
				.values(rows.map((t) => ({ tagId: t.id, notebookId: notebook })));

			return rows;
		});
	}
}

export const tagsRepository: TagRepository = new DrizzleTagRepository(db);
