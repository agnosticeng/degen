<script lang="ts">
	import { page } from '$app/state';
	import { like } from '$lib/client/requests/notebooks';
	import Pagination from '$lib/cmpnt/Pagination.svelte';
	import ProfilePicture from '$lib/cmpnt/ProfilePicture.svelte';
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import type { PageProps } from './$types';
	import { getTagHref, parse } from './search.utils';

	let { data }: PageProps = $props();

	let notebooks = $state.raw(data.notebooks);
	$effect(() => {
		notebooks = data.notebooks;
	});

	async function handleLike(notebook: (typeof notebooks)[number], count: number) {
		const index = notebooks.indexOf(notebook);
		if (index === -1) return;
		const l = await like(notebook.id, count);
		if (!l) return;

		const toAdd = l.count - notebook.userLike;
		notebooks = notebooks.with(index, {
			...notebook,
			likes: notebook.likes + toAdd,
			userLike: l.count
		});
	}

	const selectedTags = $derived(
		parse(
			page.url.searchParams.get('q') ?? '',
			data.trends.map((t) => t.name)
		).tags
	);
</script>

<svelte:head>
	<title>Degen</title>
</svelte:head>

<nav class="trends">
	{#each data.trends.slice(0, 5) as trend}
		<a href={getTagHref(page.url, trend.name)}>
			<button class="trend-button" aria-current={selectedTags.includes(trend.name)}>
				<i>#</i>{trend.name}
			</button>
		</a>
	{/each}
</nav>

<section class="list">
	<ul>
		{#each notebooks as item}
			<li>
				<div class="item-content">
					<ProfilePicture user={item.author} size={32} />
					<div class="item-info">
						<a href="/{item.author.username}/{item.slug}">
							<h1>{item.title}</h1>
						</a>
						<div class="author-info">
							<h2><a href="/{item.author.username}">@{item.author.username}</a></h2>
							<h3>{item.createdAt.toDateString()}</h3>
							<div>
								{#each item.tags as trend}
									<a href={getTagHref(page.url, trend)}>
										<button
											class="trend-button"
											style="margin-right: 4px"
											aria-current={selectedTags.includes(trend)}
										>
											<i>#</i>{trend}
										</button>
									</a>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<button
					class="likes"
					disabled={!data.authenticated || item.userLike === 10 || item.authorId === data.user?.id}
					class:full={item.userLike > 0}
					onclick={() => handleLike(item, item.userLike + 1)}
				>
					<span>{item.likes}</span>
					<Heart size={16} />
				</button>
			</li>
		{/each}
	</ul>
	<Pagination pagination={data.pagination} />
</section>

<style>
	button {
		font-weight: 500;
		border: none;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background: hsl(0, 0%, 5%);
		transition: all 0.2s ease;
	}

	button:not(:disabled):hover {
		cursor: pointer;
		background: hsl(0, 0%, 8%);
		color: hsl(0, 0%, 90%);
	}

	.trends {
		max-width: 1024px;
		margin: 0 auto;
		padding: 30px 20px 20px;

		& > a > .trend-button {
			margin-right: 10px;
			margin-bottom: 10px;
		}
	}

	.trend-button {
		background-color: hsl(0, 0%, 10%);
		padding: 2px 4px;
		border-radius: 4px;
		font-weight: 400;
		transition: all 0.2s ease;
		font-size: 12px;
		line-height: 16px;

		& > i {
			font-variant: normal;
			color: hsl(0, 0%, 33%);
			transition: color 0.2s ease;
		}

		&:not(:disabled):hover,
		&[aria-current='true'] {
			background-color: hsl(0, 0%, 20%);
			color: hsl(0, 0%, 90%);

			& > i {
				color: hsl(0, 0%, 43%);
			}
		}
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
	}

	.item-content > :global(.avatar) {
		flex-shrink: 0;
	}

	.item-info {
		margin-left: 20px;
	}

	.item-info h1 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 16px;
		margin: 0 0 7px;
		font-weight: 500;
	}

	.author-info {
		display: flex;
		align-items: center;
		gap: 5px;
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
	}

	@media screen and (max-width: 768px) {
		.author-info {
			flex-wrap: wrap;

			& > div {
				width: 100%;
			}
		}
	}

	.likes {
		display: flex;
		align-items: center;
		gap: 5px;

		& > :global(svg) {
			transition: scale 0.2s ease;
		}

		&.full > :global(svg) {
			fill: currentColor;
			color: hsl(0deg 61% 54%);
		}

		&:not(:disabled):hover > :global(svg) {
			scale: 1.1;
		}
	}
</style>
