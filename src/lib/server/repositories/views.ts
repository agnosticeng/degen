import days from 'dayjs';
import { sql } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { views } from '../db/schema';
import type { Notebook } from './notebooks';

const epoch = days.unix(1747758426);

type NewView = { notebookId: Notebook['id']; clientIPAddress: string };

export interface ViewRepository {
	addView(view: NewView): Promise<void>;
}

class DrizzleViewRepository implements ViewRepository {
	constructor(private db: DrizzleDatabase) {}

	async addView({ notebookId, clientIPAddress }: NewView) {
		const now = new Date();

		const clientId = await hash(clientIPAddress);

		await this.db
			.insert(views)
			.values({
				notebookId,
				clientId: sql`${clientId}`,
				hour: days(now).diff(epoch, 'hours'),
				createdAt: now
			})
			.onConflictDoNothing();
	}
}

async function hash(ip: string) {
	const data = new TextEncoder().encode(ip);
	const buffer = await crypto.subtle.digest('SHA-256', data);
	const view = new DataView(buffer);
	return view.getBigInt64(0);
}

export const viewRepository: ViewRepository = new DrizzleViewRepository(db);
