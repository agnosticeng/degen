<script lang="ts">
	import Chart from '$lib/cmpnt/dv/chart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = `WITH pool_info AS (
	SELECT
			block_timestamp,
			token0_amount,
			token1_amount,
			sqrt_price_x96,
			liquidity
	FROM uniswap_v3.Pool_evt_Swap
	WHERE pool_address = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'
	AND block_timestamp >= NOW() - INTERVAL '7 days'
)
SELECT
			DATE_TRUNC('hour', block_timestamp) as time,
			AVG((token1_amount::decimal / token0_amount::decimal)) as eth_price
FROM pool_info
WHERE token0_amount != 0
GROUP BY 1
ORDER BY 1 DESC
LIMIT 168;`;
</script>

<section class="info">
	<h1>@{data.notebook.author}/{data.notebook.name}</h1>

	<div class="desc">
		This query analyzes the distribution of ERC-20 token transfers across different time periods,
		focusing on wallets with high transaction volumes. It helps identify potential whale activity
		and investigates patterns in token holder behavior across major DeFi protocols. Share your
		insights with the community!
	</div>
</section>

<section class="dv">
	<div class="chart">
		<Chart />
	</div>
	<div class="query-container">
		<div class="line-numbers">
			{#each Array(query.split('\n').length) as _, i}
				<div class="line-number">{i + 1}</div>
			{/each}
		</div>
		<pre class="query">{query}</pre>
	</div>
</section>

<style>
	h1 {
		font-size: 24px;
		margin: 0;
		margin-bottom: 20px;
		font-weight: 400;
	}

	.info {
		max-width: 1024px;
		padding: 30px 20px;
		margin: auto;
	}

	.desc {
		font-weight: 300;
		color: hsl(0, 0%, 80%);
		font-size: 15px;
	}

	.dv {
		max-width: 1024px;
		margin: auto;
		padding: 30px 20px;
	}

	.chart {
		width: 100%;
		height: 500px;
		border: 1px solid hsl(0, 0%, 20%);
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
		overflow: hidden;
		background: hsl(0, 0%, 6%);
	}

	@media (max-width: 768px) {
		.chart,
		.query-container {
			height: 250px;
		}
	}

	.query-container {
		margin-top: -1px;
		display: flex;
		border: 1px solid hsl(0, 0%, 20%);
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
		overflow: hidden;
	}

	.line-numbers {
		padding: 10px 10px 10px 0;
		user-select: none;
		font-family: monospace;
	}

	.line-number {
		text-align: right;
		padding: 0 5px;
		font-family: monospace;
		color: hsl(0, 0%, 30%);
	}

	.query {
		margin: 0;
		padding: 10px;
		width: 100%;
		height: 500px;
		font-family: monospace;
		border: none;
		color: hsl(0, 0%, 60%);
	}
</style>
