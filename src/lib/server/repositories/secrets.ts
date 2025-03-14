import { LibsqlError } from '@libsql/client';
import { and, eq } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { secrets } from '../db/schema';
import { NotCreated, NotDeleted, NotUpdated } from './errors';
import type { User } from './users';

export type Secret = typeof secrets.$inferSelect;
export type NewSecret = { name: Secret['name']; value: Secret['value'] };

export interface SecretRepository {
	list(owner: User['id']): Promise<Secret[]>;
	create(owner: User['id'], secret: NewSecret): Promise<Secret>;
	update(owner: User['id'], id: Secret['id'], value: Secret['value']): Promise<Secret>;
	delete(owner: User['id'], id: Secret['id']): Promise<void>;
}

class DrizzleSecretRepository implements SecretRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(owner: User['id']) {
		return await this.db.select().from(secrets).where(eq(secrets.ownerId, owner));
	}

	async create(owner: User['id'], secret: NewSecret) {
		try {
			const [row] = await this.db
				.insert(secrets)
				.values({ name: secret.name, value: secret.value, ownerId: owner })
				.returning();

			return row;
		} catch (e) {
			if (e instanceof LibsqlError && e.code === 'SQLITE_CONSTRAINT')
				throw new NotCreated('Secrets with same already exists');

			console.error(e);
			throw e;
		}
	}

	async update(owner: User['id'], id: Secret['id'], value: Secret['value']) {
		const [row] = await this.db
			.update(secrets)
			.set({ value, updatedAt: new Date() })
			.where(and(eq(secrets.ownerId, owner), eq(secrets.id, id)))
			.returning();

		if (!row) throw new NotUpdated('Secret does not exists');

		return row;
	}

	async delete(owner: User['id'], id: Secret['id']) {
		const result = await this.db
			.delete(secrets)
			.where(and(eq(secrets.ownerId, owner), eq(secrets.id, id)));

		if (result.rowsAffected === 0) throw new NotDeleted('Secret does not exists');
		if (result.rowsAffected > 1) throw new Error('Deleted more than 1 Secret');
	}
}

export const secretRepository: SecretRepository = new DrizzleSecretRepository(db);
