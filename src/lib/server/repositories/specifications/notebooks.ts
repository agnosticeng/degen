import { notebooks } from '$lib/server/db/schema';
import { eq, inArray, like, sql } from 'drizzle-orm';
import { spec_kind, type DrizzleSpecification } from '.';
import type { Notebook } from '../notebooks';

class NotebookVisibilitySpecification implements DrizzleSpecification<Notebook> {
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
	return new NotebookVisibilitySpecification(visibilities);
}

class NotebookAuthorSpecification implements DrizzleSpecification<Notebook> {
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
	return new NotebookAuthorSpecification(author);
}

class NotebookIdSpecification implements DrizzleSpecification<Notebook> {
	readonly [spec_kind] = 'Drizzle';

	constructor(private id: Notebook['id']) {}

	satisfiedBy(entity: Notebook) {
		return entity.id === this.id;
	}

	toQuery() {
		return eq(notebooks.id, this.id);
	}
}

export function withId(id: Notebook['id']) {
	return new NotebookIdSpecification(id);
}

class NotebookSlugSpecification implements DrizzleSpecification<Notebook> {
	readonly [spec_kind] = 'Drizzle';

	constructor(private slug: Notebook['slug']) {}

	satisfiedBy(entity: Notebook) {
		return entity.slug === this.slug;
	}

	toQuery() {
		return eq(notebooks.slug, this.slug);
	}
}

export function withSlug(slug: Notebook['slug']) {
	return new NotebookSlugSpecification(slug);
}

class NotebookSearchSpecification implements DrizzleSpecification<Notebook> {
	readonly [spec_kind] = 'Drizzle';

	constructor(private search: string) {}

	satisfiedBy(entity: Notebook) {
		return entity.title.toLowerCase().includes(this.search.toLowerCase());
	}

	toQuery() {
		return like(sql`UPPER(${notebooks.title})`, `%${this.search.toUpperCase()}%`);
	}
}

export function withSearch(search: string) {
	return new NotebookSearchSpecification(search);
}
