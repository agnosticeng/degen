import { and, asc, desc, eq, getTableColumns, inArray, isNull, or, sql } from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { blocks, likes, notebooks, users } from '../db/schema';
import type { Block } from './blocks';
import { NotCreated, NotDeleted, NotFound } from './errors';
import type { Like } from './likes';
import type { User } from './users';

export type Notebook = Omit<typeof notebooks.$inferSelect, 'deletedAt'>;
type NewNotebook = Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export interface NotebookRepository {
	list(
		author?: User['id'],
		user?: User['id']
	): Promise<(Notebook & { likes: number; author: User; userLike: number })[]>;
	create(data: NewNotebook): Promise<Notebook>;
	read(
		id: Notebook['id'] | Notebook['slug'],
		user?: User['id']
	): Promise<Notebook & { author: User; blocks: Block[]; likes: Like[] }>;
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
		author?: User['id'],
		user?: User['id']
	): Promise<(Notebook & { likes: number; author: User; userLike: number })[]> {
		const notebook_likes = this.db.$with('notebook_likes').as(
			this.db
				.select({
					notebookId: likes.notebookId,
					likes: sql<number>`SUM(${likes.count})`.as('likes')
				})
				.from(likes)
				.groupBy(likes.notebookId)
		);

		const user_like = this.db.$with('user_like').as(
			this.db
				.select(getTableColumns(likes))
				.from(likes)
				.where(user ? eq(likes.userId, user) : isNull(likes.userId))
		);

		const conditions: Parameters<typeof and> = [isNull(notebooks.deletedAt)];
		if (author) conditions.push(eq(notebooks.authorId, author));
		if (!user || user !== author) conditions.push(eq(notebooks.visibility, 'public'));

		const rows = await this.db
			.with(notebook_likes, user_like)
			.select({
				...this.columns,
				likes: sql<number>`COALESCE(${notebook_likes.likes}, 0)`.as('likes'),
				author_username: users.username,
				author_externalId: users.externalId,
				author_createdAt: users.createdAt,
				current_user_likes: sql<number>`COALESCE(${user_like.count}, 0)`.as('current_user_likes')
			})
			.from(notebooks)
			.leftJoin(notebook_likes, eq(notebook_likes.notebookId, notebooks.id))
			.innerJoin(users, eq(users.id, notebooks.authorId))
			.leftJoin(user_like, eq(user_like.notebookId, notebooks.id))
			.where(and(...conditions))
			.orderBy((aliases) => [desc(aliases.likes), desc(aliases.updatedAt)]);

		return rows.map(
			({ author_username, author_externalId, author_createdAt, current_user_likes, ...row }) => ({
				...row,
				author: {
					id: row.authorId,
					username: author_username,
					externalId: author_externalId,
					createdAt: author_createdAt
				},
				userLike: current_user_likes
			})
		);
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
		id: Notebook['id'] | Notebook['slug'],
		user?: User['id']
	): Promise<Notebook & { author: User; blocks: Block[]; likes: Like[] }> {
		const notebook = await this.db.query.notebooks.findFirst({
			columns: { deletedAt: false },
			where: and(
				isNull(notebooks.deletedAt),
				typeof id === 'number' ? eq(notebooks.id, id) : eq(notebooks.slug, id),
				user
					? or(inArray(notebooks.visibility, ['public', 'unlisted']), eq(notebooks.authorId, user))
					: inArray(notebooks.visibility, ['public', 'unlisted'])
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
