<script lang="ts">
	import { page } from '$app/state';
	import type { NotebookPage } from '$lib/server/repositories/notebooks';
	import CaretLeft from './svg/caret-left.svelte';
	import CaretRight from './svg/caret-right.svelte';
	import DotsThree from './svg/dots-three.svelte';

	interface Props {
		pagination: NotebookPage['pagination'];
	}

	let { pagination }: Props = $props();

	function href(url: URL, page: number) {
		const next = new URL(url);
		next.searchParams.set('page', `${page}`);
		next.searchParams.sort();
		return next.toString();
	}

	const pages = $derived.by<Array<number | 'ellipsis'>>(() => {
		const ellipsis = 'ellipsis';

		if (pagination.total <= 5) {
			return Array.from({ length: pagination.total }, (_, i) => i + 1);
		}

		if (pagination.current <= 3) {
			return [
				...Array.from({ length: 3 }, (_, i) => i + 1),
				ellipsis,
				pagination.total - 1,
				pagination.total
			];
		}

		if (pagination.current >= pagination.total - 2) {
			return [1, 2, ellipsis, ...Array.from({ length: 3 }, (_, i) => pagination.total - 2 + i)];
		}

		return [1, 2, ellipsis, pagination.current, ellipsis, pagination.total - 1, pagination.total];
	});
</script>

{#if pagination.total > 1}
	<div role="navigation" aria-label="Pagination">
		<a
			href={href(page.url, pagination.current - 1)}
			aria-label="Previous page"
			aria-disabled={pagination.current === 1}
		>
			<CaretLeft size="16" /> Previous
		</a>
		{#each pages as p}
			{#if p === 'ellipsis'}
				<span>
					<DotsThree size="16" />
				</span>
			{:else}
				<a
					href={href(page.url, p)}
					aria-label="Page {p}"
					aria-current={pagination.current === p ? 'page' : 'false'}
				>
					{p}
				</a>
			{/if}
		{/each}
		<a
			href={href(page.url, pagination.current + 1)}
			aria-label="Next page"
			aria-disabled={pagination.current === pagination.total}
		>
			Next <CaretRight size="16" />
		</a>
	</div>
{/if}

<style>
	div {
		margin: 24px 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	span {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		padding: 5px 10px;
	}

	a {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-width: 32px;
		padding: 5px 10px;
		font-style: normal;
		line-height: 20px;
		text-align: center;
		white-space: nowrap;
		-webkit-user-select: none;
		user-select: none;
		color: hsl(0, 0%, 80%);
		border-radius: 6px;
		background-color: hsl(0, 0%, 5%);
		border: 1px solid transparent;
		transition: all 0.2s ease;

		&:not([aria-disabled='true']):hover {
			cursor: pointer;
			background-color: hsl(0, 0%, 15%);
			color: hsl(0, 0%, 90%);
		}

		&[aria-current='page'] {
			border-color: hsl(0, 0%, 15%);
		}

		&[aria-disabled='true'] {
			pointer-events: none;
			color: hsl(0, 0%, 65%);
			background-color: transparent;
		}

		& > :global(svg) {
			flex-shrink: 0;
		}
	}

	@media screen and (max-width: 768px) {
		a:not([aria-label='Previous page']):not([aria-label='Next page']) {
			display: none;
		}
	}
</style>
