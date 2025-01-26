import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { notebooks } from '../db/schema';

export interface Notebook {
	id: number;
	name: string;
	author: string;
	contents: string[];
	createdAt: Date;
	updatedAt: Date;
}

interface NotebookRepository {
	list(): Promise<Notebook[]>;
	create(data: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notebook>;
	read(id: Notebook['id']): Promise<Notebook | null>;
	update(notebook: Notebook): Promise<Notebook | null>;
	delete(id: Notebook['id']): Promise<void>;
}

class DrizzleNotebookRepository implements NotebookRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(): Promise<Notebook[]> {
		const rows = await this.db.select().from(notebooks).where(isNull(notebooks.deleted_at));

		return rows.map((row) => this.#transform(row));
	}

	async create(data: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notebook> {
		const [row] = await this.db
			.insert(notebooks)
			.values({ name: data.name, author: data.author, contents: data.contents })
			.returning();

		if (!row) throw new Error('DrizzleNotebookRepository: Something went wrong (create)');
		return this.#transform(row);
	}

	async read(id: Notebook['id']): Promise<Notebook | null> {
		const [row] = await this.db
			.select()
			.from(notebooks)
			.where(and(isNull(notebooks.deleted_at), eq(notebooks.id, id)));

		if (!row) return null;

		return this.#transform(row);
	}

	async update({ id, ...update }: Notebook): Promise<Notebook | null> {
		const [row] = await this.db
			.update(notebooks)
			.set({
				author: update.author,
				contents: update.contents,
				name: update.name,
				updated_at: sql`datetime('now')`
			})
			.where(and(eq(notebooks.id, id), isNull(notebooks.deleted_at)))
			.returning();

		if (row) return this.#transform(row);

		return null;
	}

	async delete(id: Notebook['id']): Promise<void> {
		await this.db
			.update(notebooks)
			.set({ updated_at: sql`datetime('now')`, deleted_at: sql`datetime('now')` })
			.where(and(eq(notebooks.id, id), isNull(notebooks.deleted_at)));
	}

	#transform(row: typeof notebooks.$inferSelect): Notebook {
		return { ...row, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at) };
	}
}

export const notebookRepository: NotebookRepository = new DrizzleNotebookRepository(db);
