import { and, eq } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { likes } from '../db/schema';
import { NotCreated } from './errors';
import type { Notebook } from './notebooks';
import type { User } from './users';

export type Like = typeof likes.$inferSelect;

export interface LikeRepository {
	like(notebook: Notebook['id'], user: User['id'], count?: number): Promise<Like>;
	unlike(notebook: Notebook['id'], user: User['id']): Promise<void>;
}

class DrizzleLikeRepository implements LikeRepository {
	constructor(private db: DrizzleDatabase) {}

	async like(notebook: Notebook['id'], user: User['id'], count: number = 1): Promise<Like> {
		const [row] = await this.db
			.insert(likes)
			.values({ count, notebookId: notebook, userId: user })
			.onConflictDoUpdate({
				target: [likes.notebookId, likes.userId],
				set: { count: count, updatedAt: new Date() }
			})
			.returning();
		if (!row) throw new NotCreated('Like not created');

		return row;
	}

	async unlike(notebook: Notebook['id'], user: User['id']): Promise<void> {
		await this.db.delete(likes).where(and(eq(likes.notebookId, notebook), eq(likes.userId, user)));
	}
}

export const likeRepository: LikeRepository = new DrizzleLikeRepository(db);
