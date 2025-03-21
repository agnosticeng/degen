import { LibsqlError } from '@libsql/client';
import {
	and,
	asc,
	desc,
	eq,
	exists,
	getTableColumns,
	inArray,
	isNull,
	like,
	sql
} from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { blocks, likes, notebooks, tags, tagsToNotebooks, users } from '../db/schema';
import type { Block } from './blocks';
import { NotCreated, NotDeleted, NotFound, NotUpdated } from './errors';
import type { Like } from './likes';
import { isDrizzleSpecification, type Specification } from './specifications';
import type { Tag } from './tags';
import type { User } from './users';

export type Notebook = Omit<typeof notebooks.$inferSelect, 'deletedAt'>;
type NewNotebook = Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

interface NotebookListSpecs {
	currentUserId?: User['id'];
	authorId?: User['id'];
	visibilities?: Notebook['visibility'][];
	tags?: Tag['name'][];
	search?: string;
}

interface Pagination {
	current?: number;
	perPage?: number;
}

export interface NotebookPage {
	notebooks: (Notebook & { likes: number; author: User; userLike: number; tags: Tag['name'][] })[];
	pagination: { current: number; total: number };
}

export interface NotebookRepository {
	list(specs: NotebookListSpecs, pagination?: Pagination): Promise<NotebookPage>;
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

	async list(specs: NotebookListSpecs, { current = 1, perPage = 15 }: Pagination = {}) {
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
				.where(
					typeof specs.currentUserId === 'undefined'
						? isNull(likes.userId)
						: eq(likes.userId, specs.currentUserId)
				)
		);

		const notebook_tags = this.db.$with('notebook_tags').as(
			this.db
				.select({
					notebookId: tagsToNotebooks.notebookId,
					tags: sql<string[]>`JSON_GROUP_ARRAY(${tags.name})`.as('tags')
				})
				.from(tagsToNotebooks)
				.leftJoin(tags, eq(tags.id, tagsToNotebooks.tagId))
				.groupBy(tagsToNotebooks.notebookId)
		);

		const conditions: Parameters<typeof and> = [isNull(notebooks.deletedAt)];
		if (typeof specs.authorId !== 'undefined')
			conditions.push(eq(notebooks.authorId, specs.authorId));
		if (specs.visibilities?.length)
			conditions.push(inArray(notebooks.visibility, specs.visibilities));
		if (specs.tags?.length)
			conditions.push(
				exists(
					this.db
						.select({ a: sql`1` })
						.from(sql`json_each(${notebook_tags.tags})`)
						.where(inArray(sql`value`, specs.tags))
				)
			);
		if (specs.search)
			conditions.push(like(sql`UPPER(${notebooks.title})`, `%${specs.search.toUpperCase()}%`));

		const rows = await this.db
			.with(notebook_likes, user_like, notebook_tags)
			.select({
				...this.columns,
				likes: sql<number>`COALESCE(${notebook_likes.likes}, 0)`.as('likes'),
				author: {
					id: users.id,
					username: users.username,
					pictureURL: users.pictureURL,
					externalId: users.externalId,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt
				},
				tags: sql`COALESCE(${notebook_tags.tags}, JSON_ARRAY())`
					.mapWith({
						mapFromDriverValue(value) {
							return JSON.parse(value) as string[];
						}
					})
					.as('tags'),
				userLike: sql<number>`COALESCE(${user_like.count}, 0)`.as('current_user_likes'),
				totalPages:
					sql<number>`CAST(CEIL(COUNT(*) OVER () / ${Number(perPage).toFixed(1)}) AS INT)`.as(
						'total_pages'
					)
			})
			.from(notebooks)
			.leftJoin(notebook_likes, eq(notebook_likes.notebookId, notebooks.id))
			.innerJoin(users, eq(users.id, notebooks.authorId))
			.leftJoin(user_like, eq(user_like.notebookId, notebooks.id))
			.leftJoin(notebook_tags, eq(notebook_tags.notebookId, notebooks.id))
			.where(and(...conditions))
			.orderBy((aliases) => [desc(aliases.likes), desc(aliases.createdAt)])
			.limit(perPage)
			.offset((current - 1) * perPage);

		if (!rows.length) return { notebooks: [], pagination: { current: 1, total: 0 } };

		const [{ totalPages }] = rows;

		return {
			notebooks: rows.map(({ totalPages, ...notebook }) => notebook),
			pagination: { current, total: totalPages }
		};
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
