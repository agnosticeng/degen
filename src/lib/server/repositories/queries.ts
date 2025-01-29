import { eq, inArray } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { queries } from '../db/schema';
import type { Notebook } from './notebooks';

export interface Query {
	id: number;
	sql: string;
	notebookId: Notebook['id'] | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface QueryRepository {
	list(notebookId: Notebook['id']): Promise<Query[]>;
	create(data: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>): Promise<Query>;
	batchCreate(data: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Query[]>;
	update(data: Omit<Query, 'notebookId' | 'createdAt' | 'updatedAt'>): Promise<Query>;
	batchUpdate(data: Omit<Query, 'notebookId' | 'createdAt' | 'updatedAt'>[]): Promise<Query[]>;
	delete(id: Query['id']): Promise<void>;
	batchDelete(ids: Query['id'][]): Promise<void>;
}

class DrizzleQueryRepository implements QueryRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(notebookId: Notebook['id']): Promise<Query[]> {
		return await this.db.select().from(queries).where(eq(queries.notebookId, notebookId));
	}

	async create(data: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>): Promise<Query> {
		const [row] = await this.db
			.insert(queries)
			.values({ sql: data.sql, notebookId: data.notebookId })
			.returning();

		if (!row) throw new Error('DrizzleQueryRepository: Something went wrong (create)');

		return row;
	}

	async batchCreate(data: Omit<Query, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Query[]> {
		if (data.length)
			return await this.db
				.insert(queries)
				.values(data.map((d) => ({ sql: d.sql, notebookId: d.notebookId })))
				.returning();

		return [];
	}

	async update({ id, sql }: Omit<Query, 'notebookId' | 'createdAt' | 'updatedAt'>): Promise<Query> {
		const [row] = await this.db
			.update(queries)
			.set({ sql, updatedAt: new Date() })
			.where(eq(queries.id, id))
			.returning();

		return row;
	}

	async batchUpdate(
		data: Omit<Query, 'notebookId' | 'createdAt' | 'updatedAt'>[]
	): Promise<Query[]> {
		if (data.length < 1) return [];

		const [first, ...rest] = data;

		const now = new Date();
		const response = await this.db.batch([
			this.db
				.update(queries)
				.set({ sql: first.sql, updatedAt: now })
				.where(eq(queries.id, first.id))
				.returning(),
			...rest.map((q) =>
				this.db
					.update(queries)
					.set({ sql: q.sql, updatedAt: now })
					.where(eq(queries.id, q.id))
					.returning()
			)
		]);

		return response.flat();
	}

	async delete(id: Query['id']): Promise<void> {
		await this.db.delete(queries).where(eq(queries.id, id));
	}

	async batchDelete(ids: Query['id'][]): Promise<void> {
		if (ids.length) await this.db.delete(queries).where(inArray(queries.id, ids));
	}
}

export const queryRepository: QueryRepository = new DrizzleQueryRepository(db);
