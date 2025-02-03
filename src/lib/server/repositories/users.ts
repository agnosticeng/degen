import { db, type DrizzleDatabase } from '../db';
import { users } from '../db/schema';
import { NotCreated } from './errors';

export type User = typeof users.$inferSelect;

export interface UserRepository {
	create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
	read(id: User['id']): Promise<User>;
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

	async read(id: User['id']): Promise<User> {
		throw new Error('Not implemented');
	}
}

export const userRepository: UserRepository = new DrizzleUserRepository(db);
