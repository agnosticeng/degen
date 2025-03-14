import { eq } from 'drizzle-orm';
import { spec_kind, type DrizzleSpecification, type Specification } from '.';
import { users } from '../../db/schema';
import type { User } from '../users';

class UserIdSpecification implements DrizzleSpecification<User> {
	constructor(private id: User['id']) {}

	get [spec_kind]() {
		return 'Drizzle' as const;
	}

	satisfiedBy(entity: User) {
		return entity.id === this.id;
	}

	toQuery() {
		return eq(users.id, this.id);
	}
}

export function withId(id: User['id']): Specification<User> {
	return new UserIdSpecification(id);
}

class UserUsernameSpecification implements DrizzleSpecification<User> {
	constructor(private username: User['username']) {}

	get [spec_kind]() {
		return 'Drizzle' as const;
	}

	satisfiedBy(entity: User) {
		return entity.username === this.username;
	}

	toQuery() {
		return eq(users.username, this.username);
	}
}

export function withUsername(username: User['username']): Specification<User> {
	return new UserUsernameSpecification(username);
}

class UserExternalIdSpecification implements DrizzleSpecification<User> {
	constructor(private externalId: User['externalId']) {}

	get [spec_kind]() {
		return 'Drizzle' as const;
	}

	satisfiedBy(entity: User) {
		return entity.externalId === this.externalId;
	}

	toQuery() {
		return eq(users.externalId, this.externalId);
	}
}

export function withExternalId(externalId: User['externalId']): Specification<User> {
	return new UserExternalIdSpecification(externalId);
}
