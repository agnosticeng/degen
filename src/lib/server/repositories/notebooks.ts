import { LibsqlError } from '@libsql/client';
import { and, asc, eq, getTableColumns, isNull } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { blocks, notebooks } from '../db/schema';
import type { Block } from './blocks';
import { NotCreated, NotDeleted, NotFound, NotUpdated } from './errors';
import type { Like } from './likes';
import { isDrizzleSpecification, type Specification } from './specifications';
import type { Tag } from './tags';
import type { User } from './users';

export type Notebook = Omit<typeof notebooks.$inferSelect, 'deletedAt'>;
type NewNotebook = Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export interface NotebookRepository {
	list(
		...specs: Specification<Notebook>[]
	): Promise<(Notebook & { likes: Like[]; author: User; tags: Tag[] })[]>;
	create(data: NewNotebook): Promise<Notebook>;
	read(
		...specs: Specification<Notebook>[]
	): Promise<Notebook & { author: User; blocks: Block[]; likes: Like[]; tags: Tag[] }>;
	update(notebook: Notebook, user: User['id']): Promise<Notebook>;
	delete(id: Notebook['id'], user: User['id']): Promise<void>;
}

class DrizzleNotebookRepository implements NotebookRepository {
	constructor(private db: DrizzleDatabase) {}

	private get columns() {
		const { deletedAt, ...columns } = getTableColumns(notebooks);
		return columns;
	}

	async list(
		...specs: Specification<Notebook>[]
	): Promise<(Notebook & { likes: Like[]; author: User; tags: Tag[] })[]> {
		if (!specs.every(isDrizzleSpecification)) throw new TypeError('Invalid specification');

		const rows = await this.db.query.notebooks.findMany({
			where: and(isNull(notebooks.deletedAt), ...specs.map((s) => s.toQuery())),
			with: {
				author: true,
				likes: true,
				tagsToNotebooks: { with: { tag: true } }
			}
		});

		return rows.map(({ tagsToNotebooks, ...notebook }) => ({
			...notebook,
			tags: tagsToNotebooks.map((t) => t.tag)
		}));
	}

	async create(data: NewNotebook): Promise<Notebook> {
		const [row] = await this.db
			.insert(notebooks)
			.values({
				title: data.title,
				slug: data.slug,
				visibility: data.visibility,
				authorId: data.authorId
			})
			.returning(this.columns);

		if (!row) throw new NotCreated('Notebook not created');
		return row;
	}

	async read(
		...specs: Specification<Notebook>[]
	): Promise<Notebook & { author: User; blocks: Block[]; likes: Like[]; tags: Tag[] }> {
		if (!specs.every(isDrizzleSpecification)) throw new TypeError('Invalid specification');

		const row = await this.db.query.notebooks.findFirst({
			columns: { deletedAt: false },
			where: and(isNull(notebooks.deletedAt), ...specs.map((s) => s.toQuery())),
			with: {
				author: true,
				blocks: { orderBy: asc(blocks.position) },
				likes: true,
				tagsToNotebooks: { with: { tag: true } }
			}
		});

		if (!row) throw new NotFound('Notebook not found');

		const { tagsToNotebooks, ...notebook } = row;
		return { ...notebook, tags: tagsToNotebooks.map((t) => t.tag) };
	}

	async update({ id, ...notebook }: Notebook, user: User['id']): Promise<Notebook> {
		try {
			const [updated] = await this.db
				.update(notebooks)
				.set({
					title: notebook.title,
					slug: notebook.slug,
					visibility: notebook.visibility,
					updatedAt: new Date()
				})
				.where(and(isNull(notebooks.deletedAt), eq(notebooks.id, id), eq(notebooks.authorId, user)))
				.returning(this.columns);

			if (!updated) throw new NotUpdated('Notebook not updated');

			return updated;
		} catch (e) {
			if (e instanceof LibsqlError && e.code === 'SQLITE_CONSTRAINT')
				throw new NotUpdated('slug already used');

			console.error(e);
			throw e;
		}
	}

	async delete(id: Notebook['id'], user: User['id']): Promise<void> {
		const result = await this.db
			.update(notebooks)
			.set({ deletedAt: new Date() })
			.where(and(isNull(notebooks.deletedAt), eq(notebooks.id, id), eq(notebooks.authorId, user)));

		if (result.rowsAffected === 0)
			throw new NotDeleted('Notebook not delete for identifier: ' + id);

		if (result.rowsAffected > 1) throw new Error('Deleted more than 1 Notebook');
	}
}

export const notebookRepository: NotebookRepository = new DrizzleNotebookRepository(db);
