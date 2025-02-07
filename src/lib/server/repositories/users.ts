import { db, type DrizzleDatabase } from '../db';
import { users } from '../db/schema';
import { NotCreated, NotFound } from './errors';
import { isDrizzleSpecification, type Specification } from './specifications';

export type User = typeof users.$inferSelect;

export interface UserRepository {
	create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
	read(spec: Specification<User>): Promise<User>;
}

class DrizzleUserRepository implements UserRepository {
	constructor(private db: DrizzleDatabase) {}

	async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
		const [user] = await this.db
			.insert(users)
			.values({ username: data.username, externalId: data.externalId })
			.onConflictDoUpdate({ target: users.externalId, set: { externalId: data.externalId } })
			.returning();

		if (!user) throw new NotCreated('User not created');

		return user;
	}

	async read(spec: Specification<User>): Promise<User> {
		if (!isDrizzleSpecification(spec)) throw TypeError('Invalid specification');

		const user = await this.db.query.users.findFirst({ where: spec.toQuery() });

		if (user) return user;

		throw new NotFound('User not found');
	}
}

export const userRepository: UserRepository = new DrizzleUserRepository(db);
