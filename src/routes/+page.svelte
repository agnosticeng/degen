<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import OrderBy, { parseBy, parseDir } from '$lib/cmpnt/OrderBy.svelte';
	import Pagination from '$lib/cmpnt/Pagination.svelte';
	import ProfilePicture from '$lib/cmpnt/ProfilePicture.svelte';
	import Sparkline from '$lib/cmpnt/Sparkline.svelte';
	import BranchFork from '$lib/cmpnt/svg/branch-fork.svelte';
	import Eye from '$lib/cmpnt/svg/eye.svelte';
	import Tag from '$lib/cmpnt/Tag.svelte';
	import type { PageProps } from './$types';
	import { getTagHref, parse } from './search.utils';

	let { data }: PageProps = $props();

	let notebooks = $state.raw(data.notebooks);
	$effect(() => {
		notebooks = data.notebooks;
	});

	const orderBy = $derived(parseBy(page.url.searchParams.get('by')));
	const orderDir = $derived(parseDir(page.url.searchParams.get('dir')));

	const selectedTags = $derived(
		parse(
			page.url.searchParams.get('q') ?? '',
			data.trends.map((t) => t.name)
		).tags
	);

	const toDate = (x: { date: string; views: number }) => new Date(x.date);
	function sortCompare(a: { date: string; views: number }, b: { date: string; views: number }) {
		return toDate(a).getTime() - toDate(b).getTime();
	}
</script>

<svelte:head>
	<title>Degen</title>
	<meta
		name="description"
		content="Degen is the ultimate notebook platform for data lovers. Explore public notebooks with Markdown, SQL, and interactive charts. Analyze and visualize datasets easily!"
	/>
</svelte:head>

<nav class="filters">
	<div class="trends">
		{#each data.trends.slice(0, 5) as trend}
			<a href={getTagHref(page.url, trend.name)}>
				<Tag name={trend.name} selected={selectedTags.includes(trend.name)} />
			</a>
		{/each}
	</div>
	<OrderBy
		by={orderBy}
		direction={orderDir}
		onchange={async ({ by, direction }) => {
			const url = new URL(page.url);
			url.searchParams.set('by', by);
			url.searchParams.set('dir', direction);
			await goto(url, { state: page.state });
		}}
	/>
</nav>

<section class="list">
	<ul>
		{#each notebooks as item}
			<li>
				<div class="item-content">
					<ProfilePicture user={item.author} size={32} />
					<div class="item-info">
						<a href="/{item.author.username}/{item.slug}">
							<h1>
								{item.title}
								{#if item.forkOfId}
									<BranchFork size="14" fill="hsl(0, 0%, 55%)" />
								{/if}
							</h1>
						</a>
						<div class="author-info">
							<h2><a href="/{item.author.username}">@{item.author.username}</a></h2>
							<h3>{item.createdAt.toDateString()}</h3>
							<div>
								{#each item.tags as trend}
									<a href={getTagHref(page.url, trend)}>
										<Tag selected={selectedTags.includes(trend)} name={trend} />
									</a>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="hide-tablet">
					<Sparkline
						title="{item.views} view{item.views > 1 ? 's' : ''}"
						data={item.dailyViews.toSorted(sortCompare).map((v) => v.views)}
					/>
				</div>
				<div class="total-views">
					<span>{item.views}</span>
					<Eye size="16" />
				</div>
			</li>
		{/each}
	</ul>
	<Pagination pagination={data.pagination} />
</section>

<style>
	.filters {
		max-width: 1024px;
		margin: 0 auto;
		padding: 30px 20px 20px;

		display: flex;
		align-items: baseline;
		gap: 10px;

		@media screen and (max-width: 576px) {
			flex-direction: column;
			gap: 15px;
			padding-bottom: 8px;

			& > :global(*) {
				width: 100%;
			}
		}
	}

	.trends {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.list {
		max-width: 1024px;
		margin: 0 auto;
		padding: 0 20px 20px;
	}

	.list li {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid hsl(0, 0%, 20%);
		height: 100px;
		padding: 20px;
		margin-bottom: -1px;
	}

	.item-content {
		display: flex;
		align-items: center;
		flex: 1;
		overflow: hidden;
	}

	.item-content > :global(.avatar) {
		flex-shrink: 0;
	}

	.item-info {
		margin-left: 20px;
		overflow: hidden;
	}

	.item-info h1 {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 16px;
		margin: 0 0 7px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 24px;
	}

	.author-info h2 {
		font-size: 14px;
		margin: 0;
		font-weight: 300;
		color: hsl(0, 0%, 55%);
		text-decoration: underline;
	}

	.author-info h3 {
		font-size: 14px;
		margin: 0;
		font-weight: 300;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}

	.author-info > div {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.total-views {
		display: none;
		align-items: center;
		gap: 5px;
	}

	@media screen and (max-width: 768px) {
		.author-info > div {
			display: none;
		}

		.hide-tablet {
			display: none;
		}

		.total-views {
			display: flex;
		}
	}
</style>
