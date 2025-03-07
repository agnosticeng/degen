import { or as logicalOr } from 'drizzle-orm';
import {
	isDrizzleSpecification,
	spec_kind,
	type DrizzleSpecification,
	type Specification
} from '.';

class OrSpecification<T> implements DrizzleSpecification<T> {
	readonly [spec_kind] = 'Drizzle';

	#specs: Specification<T>[];

	constructor(...specs: Specification<T>[]) {
		this.#specs = specs;
	}

	satisfiedBy(entity: T): boolean {
		return this.#specs.some((spec) => spec.satisfiedBy(entity));
	}

	toQuery() {
		if (this.#specs.every(isDrizzleSpecification)) {
			return logicalOr(...this.#specs.map((s) => s.toQuery()));
		}

		throw new TypeError('Invalid specifications');
	}
}

export function or<T>(...specs: Specification<T>[]) {
	return new OrSpecification(...specs);
}
