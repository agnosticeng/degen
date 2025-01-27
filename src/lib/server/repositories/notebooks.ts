import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { notebooks } from '../db/schema';
import type { Query } from './queries';
import type { User } from './users';

export interface Notebook {
	id: number;
	name: string;
	slug: string;
	author: string;
	contents: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface NotebookRepository {
	list(author?: User['id']): Promise<Notebook[]>;
	create(
		data: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'author'>,
		author: User
	): Promise<Notebook>;
	read(id: Notebook['id']): Promise<(Notebook & { queries: Query[] }) | null>;
	read(slug: Notebook['slug']): Promise<(Notebook & { queries: Query[] }) | null>;
	update(notebook: Notebook): Promise<void>;
	delete(id: Notebook['id']): Promise<void>;
}

class DrizzleNotebookRepository implements NotebookRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(author?: User['id']): Promise<Notebook[]> {
		let where = and(eq(notebooks.access, 'public'), isNull(notebooks.deletedAt));
		if (author) where = and(eq(notebooks.authorId, author), isNull(notebooks.deletedAt));

		const rows = await this.db.query.notebooks.findMany({ where, with: { author: true } });

		return rows.map((r) => ({ ...r, author: r.author.username }));
	}

	async create(
		data: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'author'>,
		author: User
	): Promise<Notebook> {
		const [row] = await this.db
			.insert(notebooks)
			.values({ name: data.name, slug: data.slug, contents: data.contents, authorId: author.id })
			.returning();

		return { ...row, author: author.username };
	}

	async read(
		idOrSlug: Notebook['id'] | Notebook['slug']
	): Promise<(Notebook & { queries: Query[] }) | null> {
		const where =
			typeof idOrSlug === notebooks.id.dataType
				? and(isNull(notebooks.deletedAt), eq(notebooks.id, idOrSlug as Notebook['id']))
				: and(isNull(notebooks.deletedAt), eq(notebooks.slug, idOrSlug as Notebook['slug']));

		const row = await this.db.query.notebooks.findFirst({
			where,
			with: { author: true, queries: true }
		});

		if (row) {
			return { ...row, author: row.author.username };
		}

		return null;
	}

	async update({ id, ...update }: Notebook): Promise<void> {
		await this.db
			.update(notebooks)
			.set({
				contents: update.contents,
				name: update.name,
				updatedAt: new Date()
			})
			.where(and(eq(notebooks.id, id), isNull(notebooks.deletedAt)));
	}

	async delete(id: Notebook['id']): Promise<void> {
		await this.db
			.update(notebooks)
			.set({ updatedAt: sql`datetime('now')`, deletedAt: sql`datetime('now')` })
			.where(and(eq(notebooks.id, id), isNull(notebooks.deletedAt)));
	}
}

export const notebookRepository: NotebookRepository = new DrizzleNotebookRepository(db);
