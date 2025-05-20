import days from 'dayjs';
import { db, type DrizzleDatabase } from '../db';
import { views } from '../db/schema';

const epoch = days.unix(1747758426);

type NewView = Omit<typeof views.$inferInsert, 'createdAt' | 'hour'>;

export interface ViewRepository {
	addView(view: NewView): Promise<void>;
}

class DrizzleViewRepository implements ViewRepository {
	constructor(private db: DrizzleDatabase) {}

	async addView({ clientId, notebookId }: NewView) {
		const now = new Date();

		await this.db
			.insert(views)
			.values({
				notebookId,
				clientId,
				hour: days(now).diff(epoch, 'hours'),
				createdAt: now
			})
			.onConflictDoNothing();
	}
}

export const viewRepository: ViewRepository = new DrizzleViewRepository(db);
