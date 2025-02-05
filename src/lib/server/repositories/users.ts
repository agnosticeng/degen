import { eq } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { users } from '../db/schema';
import { NotCreated, NotFound } from './errors';

export type User = typeof users.$inferSelect;

export interface UserRepository {
	create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
	read(id: User['id']): Promise<User>;
	read(username: User['username']): Promise<User>;
}

class DrizzleUserRepository implements UserRepository {
	constructor(private db: DrizzleDatabase) {}

	async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
		const [user] = await this.db
			.insert(users)
			.values({ username: data.username, externalId: data.externalId })
			.returning();

		if (!user) throw new NotCreated('User not created');

		return user;
	}

	async read(identifier: User['id'] | User['username']): Promise<User> {
		const user = await this.db.query.users.findFirst({
			where:
				typeof identifier === 'number' ? eq(users.id, identifier) : eq(users.username, identifier)
		});

		if (user) return user;

		throw new NotFound('User not found for identifier ' + identifier);
	}
}

export const userRepository: UserRepository = new DrizzleUserRepository(db);
