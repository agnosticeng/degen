import { LibsqlError } from '@libsql/client';
import {
	and,
	asc,
	count,
	desc,
	eq,
	exists,
	getTableColumns,
	inArray,
	isNull,
	like,
	type SQL,
	sql
} from 'drizzle-orm';
import { db, type DrizzleDatabase } from '../db';
import { blocks, likes, notebooks, tags, tagsToNotebooks, users, views } from '../db/schema';
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
	sorting?: { by: 'likes' | 'title' | 'createdAt' | 'trends'; direction: 'asc' | 'desc' };
}

interface Pagination {
	current?: number;
	perPage?: number;
}

interface DailyViews {
	date: string;
	views: number;
}

export interface NotebookPage {
	notebooks: (Notebook & {
		likes: number;
		author: User;
		userLike: number;
		tags: Tag['name'][];
		views: number;
		dailyViews: DailyViews[];
	})[];
	pagination: { current: number; total: number };
}

export interface NotebookRepository {
	list(specs: NotebookListSpecs, pagination?: Pagination): Promise<NotebookPage>;
	listForSitemap(): Promise<
		{ username: User['username']; slug: Notebook['slug']; lastModification: Date }[]
	>;
	create(data: NewNotebook): Promise<Notebook>;
	read(...specs: Specification<Notebook>[]): Promise<
		Notebook & {
			author: User;
			blocks: Block[];
			likes: Like[];
			tags: Tag[];
			forkOf?: (Notebook & { author: User }) | null;
		}
	>;
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
		specs: NotebookListSpecs,
		{ current = 1, perPage = 15 }: Pagination = {}
	): Promise<NotebookPage> {
		// Create CTE for aggregating likes per notebook
		const notebookLikes = db.$with('notebook_likes').as(
			db
				.select({
					notebookId: likes.notebookId,
					totalLikes: sql<number>`COALESCE(SUM(${likes.count}), 0)`.as('total_likes')
				})
				.from(likes)
				.groupBy(likes.notebookId)
		);

		// Create CTE for current user's likes
		const userLikes = db.$with('user_likes').as(
			db
				.select({
					notebookId: likes.notebookId,
					userLike: likes.count
				})
				.from(likes)
				.where(specs.currentUserId ? eq(likes.userId, specs.currentUserId) : sql`FALSE`)
		);

		// Create CTE for tags per notebook
		const notebookTags = db.$with('notebook_tags').as(
			db
				.select({
					notebookId: tagsToNotebooks.notebookId,
					tagNames: sql<string>`JSON_GROUP_ARRAY(${tags.name})`.as('tag_names')
				})
				.from(tagsToNotebooks)
				.leftJoin(tags, eq(tags.id, tagsToNotebooks.tagId))
				.groupBy(tagsToNotebooks.notebookId)
		);

		// Create CTE for total views
		const totalViews = db.$with('total_views').as(
			db
				.select({
					notebookId: views.notebookId,
					total: count().as('total_views')
				})
				.from(views)
				.groupBy(views.notebookId)
		);

		// Create CTE for daily views over last 7 days
		const dailyViews = db.$with('daily_views').as(
			db
				.select({
					notebookId: views.notebookId,
					date: sql<string>`date(${views.createdAt}, 'unixepoch')`.as('date'),
					viewCount: count().as('view_count')
				})
				.from(views)
				.where(sql`${views.createdAt} >= unixepoch() - 7 * 24 * 60 * 60`)
				.groupBy(views.notebookId, sql`date(${views.createdAt}, 'unixepoch')`)
		);

		// Create date series for last 7 days
		const dateRange = db.$with('date_range').as(
			db
				.select({
					date: sql<string>`date(unixepoch() - value * 24 * 60 * 60, 'unixepoch')`.as('date')
				})
				.from(sql`json_each('[0,1,2,3,4,5,6]')`)
		);

		// Build WHERE conditions
		const conditions: SQL[] = [isNull(notebooks.deletedAt)];

		if (specs.authorId) {
			conditions.push(eq(notebooks.authorId, specs.authorId));
		}

		if (specs.visibilities?.length) {
			conditions.push(inArray(notebooks.visibility, specs.visibilities));
		}

		if (specs.search) {
			conditions.push(like(sql`UPPER(${notebooks.title})`, `%${specs.search.toUpperCase()}%`));
		}

		if (specs.tags?.length) {
			conditions.push(
				exists(
					db
						.select({ value: sql`1` })
						.from(sql`json_each(${notebookTags.tagNames})`)
						.where(inArray(sql`value`, specs.tags))
				)
			);
		}

		// Build ORDER BY clause
		const sorting = {
			by: specs.sorting?.by ?? 'createdAt',
			direction: specs.sorting?.direction ?? 'desc'
		} as const;

		const orderBy = (): SQL[] => {
			const dir = sorting.direction === 'asc' ? asc : desc;

			switch (sorting.by) {
				case 'likes':
					return [dir(sql`COALESCE(${notebookLikes.totalLikes}, 0)`), desc(notebooks.createdAt)];
				case 'title':
					return [dir(notebooks.title), desc(notebooks.createdAt)];
				case 'createdAt':
				case 'trends':
					return [dir(notebooks.createdAt)];
			}
		};

		// Execute main query with CTEs for trends sorting
		if (sorting.by === 'trends') {
			const dir = sorting.direction === 'asc' ? asc : desc;

			const rows = await db
				.with(notebookLikes, userLikes, notebookTags, totalViews, dailyViews, dateRange)
				.select({
					// Notebook fields
					id: notebooks.id,
					authorId: notebooks.authorId,
					title: notebooks.title,
					slug: notebooks.slug,
					visibility: notebooks.visibility,
					forkOfId: notebooks.forkOfId,
					createdAt: notebooks.createdAt,
					updatedAt: notebooks.updatedAt,

					// Author fields
					author: {
						id: users.id,
						username: users.username,
						externalId: users.externalId,
						createdAt: users.createdAt,
						updatedAt: users.updatedAt
					},

					// Aggregated fields
					likes: sql<number>`COALESCE(${notebookLikes.totalLikes}, 0)`,
					userLike: sql<number>`COALESCE(${userLikes.userLike}, 0)`,
					tags: sql<string>`COALESCE(${notebookTags.tagNames}, '[]')`,
					views: sql<number>`COALESCE(${totalViews.total}, 0)`,

					// Daily views as JSON array
					dailyViews: sql<string>`(
        SELECT json_group_array(
          json_object(
            'date', date_range.date,
            'views', COALESCE(daily_views.view_count, 0)
          )
        )
        FROM date_range
        LEFT JOIN daily_views ON 
          daily_views.notebook_id = ${notebooks.id}
          AND daily_views.date = date_range.date
        ORDER BY date_range.date DESC
      )`.as('daily_views'),

					// Pagination
					totalPages: sql<number>`CAST(
        CEIL(COUNT(*) OVER() / ${perPage}) AS INTEGER
      )`.as('total_pages')
				})
				.from(notebooks)
				.innerJoin(users, eq(users.id, notebooks.authorId))
				.leftJoin(notebookLikes, eq(notebookLikes.notebookId, notebooks.id))
				.leftJoin(userLikes, eq(userLikes.notebookId, notebooks.id))
				.leftJoin(notebookTags, eq(notebookTags.notebookId, notebooks.id))
				.leftJoin(totalViews, eq(totalViews.notebookId, notebooks.id))
				.where(and(...conditions))
				.orderBy(dir(notebooks.createdAt))
				.limit(perPage)
				.offset((current - 1) * perPage);

			if (!rows.length) {
				return {
					notebooks: [],
					pagination: { current: 1, total: 0 }
				};
			}

			return {
				notebooks: rows.map(({ totalPages, ...notebook }) => ({
					...notebook,
					tags: JSON.parse(notebook.tags),
					dailyViews: JSON.parse(notebook.dailyViews)
				})),
				pagination: {
					current,
					total: rows[0].totalPages
				}
			};
		}

		// Execute main query with CTEs
		const rows = await db
			.with(notebookLikes, userLikes, notebookTags, totalViews, dailyViews, dateRange)
			.select({
				// Notebook fields
				id: notebooks.id,
				authorId: notebooks.authorId,
				title: notebooks.title,
				slug: notebooks.slug,
				visibility: notebooks.visibility,
				forkOfId: notebooks.forkOfId,
				createdAt: notebooks.createdAt,
				updatedAt: notebooks.updatedAt,

				// Author fields
				author: {
					id: users.id,
					username: users.username,
					externalId: users.externalId,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt
				},

				// Aggregated fields
				likes: sql<number>`COALESCE(${notebookLikes.totalLikes}, 0)`,
				userLike: sql<number>`COALESCE(${userLikes.userLike}, 0)`,
				tags: sql<string>`COALESCE(${notebookTags.tagNames}, '[]')`,
				views: sql<number>`COALESCE(${totalViews.total}, 0)`,

				// Daily views as JSON array
				dailyViews: sql<string>`(
        SELECT json_group_array(
          json_object(
            'date', date_range.date,
            'views', COALESCE(daily_views.view_count, 0)
          )
        )
        FROM date_range
        LEFT JOIN daily_views ON 
          daily_views.notebook_id = ${notebooks.id}
          AND daily_views.date = date_range.date
        ORDER BY date_range.date DESC
      )`.as('daily_views'),

				// Pagination
				totalPages: sql<number>`CAST(
        CEIL(COUNT(*) OVER() / ${perPage}) AS INTEGER
      )`.as('total_pages')
			})
			.from(notebooks)
			.innerJoin(users, eq(users.id, notebooks.authorId))
			.leftJoin(notebookLikes, eq(notebookLikes.notebookId, notebooks.id))
			.leftJoin(userLikes, eq(userLikes.notebookId, notebooks.id))
			.leftJoin(notebookTags, eq(notebookTags.notebookId, notebooks.id))
			.leftJoin(totalViews, eq(totalViews.notebookId, notebooks.id))
			.where(and(...conditions))
			.orderBy(...orderBy())
			.limit(perPage)
			.offset((current - 1) * perPage);

		if (!rows.length) {
			return {
				notebooks: [],
				pagination: { current: 1, total: 0 }
			};
		}

		return {
			notebooks: rows.map(({ totalPages, ...notebook }) => ({
				...notebook,
				tags: JSON.parse(notebook.tags),
				dailyViews: JSON.parse(notebook.dailyViews)
			})),
			pagination: {
				current,
				total: rows[0].totalPages
			}
		};
	}

	async listForSitemap() {
		const rows = await this.db.query.notebooks.findMany({
			columns: { slug: true, updatedAt: true },
			with: { author: { columns: { username: true } }, blocks: { columns: { updatedAt: true } } },
			where: and(eq(notebooks.visibility, 'public'), isNull(notebooks.deletedAt))
		});

		return rows.map((r) => ({
			username: r.author.username,
			slug: r.slug,
			lastModification: new Date(
				Math.max(r.updatedAt.getTime(), ...r.blocks.map((b) => b.updatedAt.getTime()))
			)
		}));
	}

	async create(data: NewNotebook): Promise<Notebook> {
		const [row] = await this.db
			.insert(notebooks)
			.values({
				title: data.title,
				slug: data.slug,
				visibility: data.visibility,
				authorId: data.authorId,
				forkOfId: data.forkOfId
			})
			.returning(this.columns);

		if (!row) throw new NotCreated('Notebook not created');
		return row;
	}

	async read(...specs: Specification<Notebook>[]): Promise<
		Notebook & {
			author: User;
			blocks: Block[];
			likes: Like[];
			tags: Tag[];
			forked?: (Notebook & { author: User }) | null;
		}
	> {
		if (!specs.every(isDrizzleSpecification)) throw new TypeError('Invalid specification');

		const row = await this.db.query.notebooks.findFirst({
			columns: { deletedAt: false },
			where: and(isNull(notebooks.deletedAt), ...specs.map((s) => s.toQuery())),
			with: {
				author: true,
				blocks: { orderBy: asc(blocks.position) },
				likes: true,
				tagsToNotebooks: { with: { tag: true } },
				forkOf: { with: { author: true }, columns: { deletedAt: false } }
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

		await this.db.update(notebooks).set({ forkOfId: null }).where(eq(notebooks.forkOfId, id));
	}
}

export const notebookRepository: NotebookRepository = new DrizzleNotebookRepository(db);
