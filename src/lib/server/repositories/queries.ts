import { eq } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { queries } from '../db/schema';
import type { Notebook } from './notebooks';

export interface Query {
	id: number;
	sql: string;
	notebookId: Notebook['id'] | null;
}

export interface QueryRepository {
	list(notebookId: Notebook['id']): Promise<Query[]>;
	create(data: Omit<Query, 'id'>): Promise<Query>;
	batchCreate(data: Omit<Query, 'id'>[]): Promise<Query[]>;
	delete(id: Query['id']): Promise<void>;
	deleteNotebookQueries(notebookId: Notebook['id']): Promise<void>;
}

class DrizzleQueryRepository implements QueryRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(notebookId: Notebook['id']): Promise<Query[]> {
		const rows = await this.db.select().from(queries).where(eq(queries.notebook_id, notebookId));

		return rows.map((r) => this.#transform(r));
	}

	async create(data: Omit<Query, 'id'>): Promise<Query> {
		const [row] = await this.db
			.insert(queries)
			.values({ sql: data.sql, notebook_id: data.notebookId })
			.returning();

		if (!row) throw new Error('DrizzleQueryRepository: Something went wrong (create)');

		return this.#transform(row);
	}

	async batchCreate(data: Omit<Query, 'id'>[]): Promise<Query[]> {
		const rows = await this.db
			.insert(queries)
			.values(data.map((d) => ({ sql: d.sql, notebook_id: d.notebookId })))
			.returning();

		return rows.map((r) => this.#transform(r));
	}

	async delete(id: Query['id']): Promise<void> {
		await this.db.delete(queries).where(eq(queries.id, id));
	}

	async deleteNotebookQueries(notebookId: Notebook['id']): Promise<void> {
		await this.db.delete(queries).where(eq(queries.notebook_id, notebookId));
	}

	#transform(row: typeof queries.$inferSelect): Query {
		return { ...row, notebookId: row.notebook_id };
	}
}

export const queryRepository: QueryRepository = new DrizzleQueryRepository(db);
