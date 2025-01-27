import { eq } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { users } from '../db/schema';

export interface User {
	id: number;
	providerId: string;
	username: string;
}

export interface UserRepository {
	create(data: Omit<User, 'id'>): Promise<User>;
	read(id: User['id']): Promise<User>;
}

class DrizzleUserRepository implements UserRepository {
	constructor(private db: DrizzleDatabase) {}

	async create(data: Omit<User, 'id'>): Promise<User> {
		const [row] = await this.db
			.insert(users)
			.values({ ...data })
			.returning();

		return row;
	}

	async read(id: User['id']): Promise<User> {
		const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
		return user;
	}
}

export const userRepository: UserRepository = new DrizzleUserRepository(db);
