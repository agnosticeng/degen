import { and, eq, isNotNull, type SQL } from 'drizzle-orm';
import { users } from '../db/schema';
import type { User } from './users';

export const spec_kind = Symbol('spec_kind');

export interface Specification<T> {
	readonly [spec_kind]: string;
	satisfiedBy(entity: T): boolean;
}

export interface DrizzleSpecification<T> extends Specification<T> {
	readonly [spec_kind]: 'Drizzle';
	toQuery(): SQL | undefined;
}

export function isDrizzleSpecification<T>(spec: Specification<T>): spec is DrizzleSpecification<T> {
	return spec[spec_kind] === 'Drizzle';
}

export class UserIdSpecification implements DrizzleSpecification<User> {
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

export class UserUsernameSpecification implements DrizzleSpecification<User> {
	constructor(private username: NonNullable<User['username']>) {}

	get [spec_kind]() {
		return 'Drizzle' as const;
	}

	satisfiedBy(entity: User) {
		return entity.username === this.username;
	}

	toQuery() {
		return and(isNotNull(users.username), eq(users.username, this.username));
	}
}

export class UserExternalIdSpecification implements DrizzleSpecification<User> {
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
