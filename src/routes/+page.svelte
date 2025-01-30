<script lang="ts">
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import Pie from '$lib/cmpnt/svg/pie.svelte';
	import Profile from '$lib/cmpnt/svg/profile.svelte';
	import type { PageProps } from './$types';

	const trends = ['DeFi', 'Stablecoin', 'Base', 'Polymarket'];
	let { data }: PageProps = $props();
</script>

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
							<h2>@{item.author.username}</h2>
							<h3>{item.createdAt.toDateString()}</h3>
						</div>
					</div>
				</div>

				<div class="likes">
					<span>{item.likes}</span>
					<Heart size={16} />
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	button {
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background: hsl(0, 0%, 5%);
		transition: all 0.2s ease;
	}

	button:hover {
		background: hsl(0, 0%, 8%);
		color: hsl(0, 0%, 90%);
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
	}

	.trend-button:hover {
		background: transparent;
		color: hsl(0, 0%, 90%);
		border-color: hsl(0, 0%, 30%);
	}

	i {
		font-variant: normal;
		color: hsl(0, 0%, 33%);
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
		justify-content: space-between;
		border: 1px solid hsl(0, 0%, 20%);
		height: 100px;
		padding: 20px;
		margin-bottom: -1px;
	}

	.item-content {
		display: flex;
		align-items: center;
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
</style>
