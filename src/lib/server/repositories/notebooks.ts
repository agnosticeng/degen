import { and, asc, desc, eq, getTableColumns, inArray, isNull, or } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { blocks, notebooks } from '../db/schema';
import type { Block } from './blocks';
import { NotCreated, NotDeleted, NotFound } from './errors';
import type { Like } from './likes';
import type { User } from './users';

export type Notebook = Omit<typeof notebooks.$inferSelect, 'deletedAt'>;
type NewNotebook = Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export interface NotebookRepository {
	list(author?: User['id']): Promise<(Notebook & { likes: number; author: User })[]>;
	create(data: NewNotebook): Promise<Notebook>;
	read(
		id: Notebook['id'] | Notebook['slug'],
		user: User['id']
	): Promise<Notebook & { author: User; blocks: Block[]; likes: Like[] }>;
	update(notebook: Notebook, user: User['id']): Promise<Notebook>;
	delete(id: Notebook['id'], user: User['id']): Promise<void>;
}

class DrizzleNotebookRepository implements NotebookRepository {
	constructor(private db: DrizzleDatabase) {}

	async list(author?: User['id']): Promise<(Notebook & { likes: number; author: User })[]> {
		let where = and(isNull(notebooks.deletedAt), eq(notebooks.visibility, 'public'));
		if (author) where = and(isNull(notebooks.deletedAt), eq(notebooks.authorId, author));

		const rows = await this.db.query.notebooks.findMany({
			columns: { deletedAt: false },
			where,
			orderBy: [desc(notebooks.updatedAt)],
			with: { author: true, likes: { columns: { count: true } } }
		});

		return rows.map((r) => ({ ...r, likes: r.likes.reduce((a, l) => a + l.count, 0) }));
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
			.returning();

		if (!row) throw new NotCreated('Notebook not created');
		const { deletedAt, ...notebook } = row;
		return notebook;
	}

	async read(
		id: Notebook['id'] | Notebook['slug'],
		user: User['id']
	): Promise<Notebook & { author: User; blocks: Block[]; likes: Like[] }> {
		const notebook = await this.db.query.notebooks.findFirst({
			columns: { deletedAt: false },
			where: and(
				isNull(notebooks.deletedAt),
				typeof id === 'number' ? eq(notebooks.id, id) : eq(notebooks.slug, id),
				or(inArray(notebooks.visibility, ['public', 'unlisted']), eq(notebooks.authorId, user))
			),
			with: {
				author: true,
				blocks: { orderBy: asc(blocks.position) },
				likes: true
			}
		});

		if (!notebook) throw new NotFound('Notebook not found for identifier' + id);

		return notebook;
	}

	async update({ id, ...notebook }: Notebook, user: User['id']): Promise<Notebook> {
		const { deletedAt, ...columns } = getTableColumns(notebooks);
		const [updated] = await this.db
			.update(notebooks)
			.set({
				title: notebook.title,
				slug: notebook.slug,
				visibility: notebook.visibility,
				updatedAt: new Date()
			})
			.where(and(isNull(notebooks.deletedAt), eq(notebooks.id, id), eq(notebooks.authorId, user)))
			.returning(columns);

		if (!updated) throw new Error('Notebook not updated');

		return updated;
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
