import { eq } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { users } from '../db/schema';
import { NotCreated, NotFound, NotUpdated } from './errors';
import { isDrizzleSpecification, type Specification } from './specifications';

export type User = typeof users.$inferSelect;
export type NewUser = Omit<typeof users.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUser = MakeRequired<
	Omit<typeof users.$inferInsert, 'createdAt' | 'externalId' | 'username' | 'updatedAt'>,
	'id'
>;

export interface UserRepository {
	create(data: NewUser): Promise<User>;
	read(spec: Specification<User>): Promise<User>;
	update(user: UpdateUser): Promise<User>;
}

class DrizzleUserRepository implements UserRepository {
	constructor(private db: DrizzleDatabase) {}

	async create(data: NewUser): Promise<User> {
		const [user] = await this.db
			.insert(users)
			.values({ username: data.username, externalId: data.externalId, pictureURL: data.pictureURL })
			.onConflictDoUpdate({ target: users.externalId, set: { externalId: data.externalId } })
			.returning();

		if (!user) throw new NotCreated('User not created');

		return user;
	}

	async read(spec: Specification<User>): Promise<User> {
		if (!isDrizzleSpecification(spec)) throw new TypeError('Invalid specification');

		const user = await this.db.query.users.findFirst({ where: spec.toQuery() });

		if (user) return user;

		throw new NotFound('User not found');
	}

	async update({ id, ...data }: UpdateUser) {
		const [user] = await this.db
			.update(users)
			.set({ pictureURL: data.pictureURL, updatedAt: new Date() })
			.where(eq(users.id, id))
			.returning();
		if (user) return user;

		throw new NotUpdated('User not found');
	}
}

export const userRepository: UserRepository = new DrizzleUserRepository(db);
