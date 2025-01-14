<script>
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import Pie from '$lib/cmpnt/svg/pie.svelte';
	import Profile from '$lib/cmpnt/svg/profile.svelte';

	const trends = ['DeFi', 'Stablecoin', 'Base', 'Polymarket'];
	const items = [
		{ id: 'a2x9f', title: 'Ethereum Price', date: new Date(), author: 'didierfranc', likes: 111 },
		{ id: 'b4k7m', title: 'Bitcoin Analysis', date: new Date(), author: 'satoshi', likes: 245 },
		{ id: 'c6p3n', title: 'DeFi Landscape 2024', date: new Date(), author: 'vitalik', likes: 523 },
		{ id: 'd8q5r', title: 'Layer 2 Solutions', date: new Date(), author: 'cryptodev', likes: 167 },
		{ id: 'e1w2s', title: 'NFT Market Update', date: new Date(), author: 'nftexpert', likes: 89 },
		{
			id: 'f7y4t',
			title: 'Smart Contract Security',
			date: new Date(),
			author: 'securityguru',
			likes: 334
		},
		{ id: 'g9h6v', title: 'DAO Governance', date: new Date(), author: 'daodude', likes: 156 },
		{ id: 'h3j8u', title: 'Web3 Development', date: new Date(), author: 'web3dev', likes: 278 },
		{
			id: 'i5l1w',
			title: 'Crypto Regulations',
			date: new Date(),
			author: 'cryptolawyer',
			likes: 192
		},
		{
			id: 'j2m4z',
			title: 'Metaverse Projects',
			date: new Date(),
			author: 'metabuilder',
			likes: 145
		}
	];

	function formatTitle(title) {
		return title.toLowerCase().replace(/\s+/g, '-');
	}
</script>

<section class="trends">
	{#each trends as trend}
		<button class="trend-button"><i>#</i>{trend}</button>
	{/each}
</section>
<section class="list">
	<ul>
		{#each items as item}
			<li>
				<div class="item-content">
					<Profile handle={item.author} size={32} />
					<div class="item-info">
						<a href={`${item.author}/${formatTitle(item.title)}`}
							><h1><Pie /><span>{item.title}</span></h1></a
						>
						<div class="author-info">
							<h2>@{item.author}</h2>
							<h3>
								{item.date.toDateString()}
							</h3>
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
