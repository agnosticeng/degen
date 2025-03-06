import { notebooks } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { spec_kind, type DrizzleSpecification } from '.';
import type { Notebook } from '../notebooks';

class VisibilitiesSpecification implements DrizzleSpecification<Notebook> {
	readonly [spec_kind] = 'Drizzle';

	constructor(private visibilities: Notebook['visibility'][]) {}

	satisfiedBy(entity: Notebook) {
		return this.visibilities.includes(entity.visibility);
	}

	toQuery() {
		return inArray(notebooks.visibility, this.visibilities);
	}
}

export function withVisibilities(visibilities: Notebook['visibility'][]) {
	return new VisibilitiesSpecification(visibilities);
}

class AuthorSpecification implements DrizzleSpecification<Notebook> {
	readonly [spec_kind] = 'Drizzle';

	constructor(private author: Notebook['authorId']) {}

	satisfiedBy(entity: Notebook) {
		return entity.authorId === this.author;
	}

	toQuery() {
		return eq(notebooks.authorId, this.author);
	}
}

export function withAuthor(author: Notebook['authorId']) {
	return new AuthorSpecification(author);
}
