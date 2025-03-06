import type { SQL } from 'drizzle-orm';

export const spec_kind = Symbol('spec_kind');

export interface Specification<T> {
	readonly [spec_kind]: string;
	satisfiedBy(entity: T): boolean;
}

export interface DrizzleSpecification<T> extends Specification<T> {
	readonly [spec_kind]: 'Drizzle';
	toQuery(): SQL;
}

export function isDrizzleSpecification<T>(spec: Specification<T>): spec is DrizzleSpecification<T> {
	return spec[spec_kind] === 'Drizzle';
}
