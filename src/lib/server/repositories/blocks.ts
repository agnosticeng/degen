import { asc, eq, inArray } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { blocks } from '../db/schema';
import type { Notebook } from './notebooks';

export type Block = typeof blocks.$inferSelect;
export type NewBlock = Omit<Block, 'id' | 'createdAt' | 'updatedAt'>;
export type BlockToUpdate = Omit<Block, 'createdAt' | 'updatedAt' | 'notebookId'>;
export type EditionBlock =
	| Block
	| Prettify<Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'notebookId'>>;

export interface BlockRepository {
	list(notebook: Notebook['id']): Promise<Block[]>;
	batchCreate(data: NewBlock[]): Promise<Block[]>;
	batchUpdate(data: BlockToUpdate[]): Promise<Block[]>;
	batchDelete(ids: Block['id'][]): Promise<void>;
}

class DrizzleBlockRepository implements BlockRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(notebook: Notebook['id']): Promise<Block[]> {
		return await this.db
			.select()
			.from(blocks)
			.where(eq(blocks.notebookId, notebook))
			.orderBy(asc(blocks.position));
	}

	async batchCreate(data: NewBlock[]): Promise<Block[]> {
		if (!data.length) return [];
		return await this.db.insert(blocks).values(data).returning();
	}

	async batchUpdate([first, ...rest]: BlockToUpdate[]): Promise<Block[]> {
		if (!first) return [];

		const now = new Date();
		const rows = await this.db.batch([
			this.update(first, now),
			...rest.map((r) => this.update(r, now))
		]);

		return rows.flat();
	}

	private update({ id, ...data }: BlockToUpdate, updatedAt: Date) {
		return this.db
			.update(blocks)
			.set({
				content: data.content,
				pinned: data.pinned,
				position: data.position,
				type: data.type,
				updatedAt
			})
			.where(eq(blocks.id, id))
			.returning();
	}

	async batchDelete(ids: Block['id'][]): Promise<void> {
		if (!ids.length) return;
		await this.db.delete(blocks).where(inArray(blocks.id, ids));
	}
}

export const blockRepository: BlockRepository = new DrizzleBlockRepository(db);
