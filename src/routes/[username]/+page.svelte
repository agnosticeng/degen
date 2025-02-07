<script lang="ts">
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import Pie from '$lib/cmpnt/svg/pie.svelte';
	import Profile from '$lib/cmpnt/svg/profile.svelte';
	import Visibility from '$lib/cmpnt/Visibility.svelte';
	import type { PageProps } from './$types';

	const trends = ['DeFi', 'Stablecoin', 'Base', 'Polymarket'];
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Degen • {data.author.username}</title>
</svelte:head>

<header>
	<div class="author">
		<Profile handle={data.author.username} size={32} />
		<div class="username">{data.author.username}</div>
	</div>
</header>

<section class="trends">
	{#each trends as trend}
		<button class="trend-button"><i>#</i>{trend}</button>
	{/each}
</section>
<section class="list">
	<ul>
		{#each data.notebooks as item}
			<li>
				<div class="item-content">
					<Profile handle={item.author.username} size={32} />
					<div class="item-info">
						<a href="/{item.author.username}/{item.slug}">
							<h1><Pie /><span>{item.title}</span></h1>
						</a>
						<div class="author-info">
							{#if item.author.id === data.user?.id}
								<Visibility visibility={item.visibility} />
							{/if}
							<h2><a href="/{item.author.username}">@{item.author.username}</a></h2>
							<h3>{item.createdAt.toDateString()}</h3>
						</div>
					</div>
				</div>

				<div class="likes"><span>{item.likes}</span><Heart size={16} /></div>
			</li>
		{/each}
	</ul>
</section>

<style>
	header {
		width: 100%;
		max-width: 1024px;
		margin: 16px auto 8px;
		padding: 0 20px;

		display: flex;
		gap: 6px;

		& > div.author {
			flex: 1;
			overflow: hidden;

			display: flex;
			align-items: center;
			gap: 8px;

			& > :global(div.avatar) {
				flex-shrink: 0;
			}

			& > div.username {
				flex: 1;
				font-weight: 500;

				text-overflow: ellipsis;
				white-space: nowrap;
				overflow: hidden;
			}
		}
	}

	.trends {
		max-width: 1024px;
		margin: 0 auto;
		padding: 30px 20px 20px 20px;
	}

	.trend-button {
		background: transparent;
		border: 1px solid hsl(0, 0%, 20%);
		margin-right: 10px;
		margin-bottom: 10px;
		font-weight: 400;
		transition: all 0.2s ease;
		font-size: 12px;

		&:hover {
			background-color: transparent;
			color: hsl(0, 0%, 90%);
			border-color: hsl(0, 0%, 30%);
		}

		& i {
			font-variant: normal;
			color: hsl(0, 0%, 33%);
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

	li {
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

	.item-info {
		margin-left: 20px;
	}

	.item-info h1 {
		display: flex;
		font-size: 16px;
		margin: 0 0 7px;
		font-weight: 500;
	}

	.item-info h1 span {
		margin-left: 10px;
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

	.likes {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	button {
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background-color: transparent;
		transition: all 0.2s ease;

		&:hover {
			background-color: hsl(0, 0%, 8%);
			color: hsl(0, 0%, 90%);
		}
	}
</style>
