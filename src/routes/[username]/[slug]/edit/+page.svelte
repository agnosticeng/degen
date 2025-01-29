<script lang="ts">
	import Plus from '$lib/cmpnt/svg/plus.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { PageProps } from './$types';
	import Block from './Block.svelte';

	let { data }: PageProps = $props();
	let blocks = $state(data.notebook.contents);

	async function save() {
		const r = await fetch(`/api/notebooks/${data.notebook.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ contents: $state.snapshot(blocks) })
		});
		if (r.ok) {
			const notebook: Notebook = await r.json();
			blocks = notebook.contents;
		}
	}
</script>

<section>
	<header>
		<button onclick={save}>Save</button>
	</header>
	{#each blocks as _block, i}
		<Block bind:value={blocks[i]} />
		<button
			class="add-block"
			onclick={() => {
				blocks.splice(i + 1, 0, '');
			}}
		>
			<Plus size="16" />
		</button>
	{/each}
</section>

<style>
	section {
		max-width: 1024px;
		margin: 0 auto;
		padding: 20px 20px;
	}

	header {
		width: 100%;
		display: flex;
		justify-content: end;
	}

	header button {
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background: hsl(0, 0%, 12%);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;

		&:hover {
			background: hsl(0, 0%, 15%);
			color: hsl(0, 0%, 90%);
		}
	}

	button {
		appearance: none;
		outline: none;
		border: none;
		background-color: transparent;
		color: currentColor;
		font-size: 10px;
		padding: 0;

		&:is(:hover, :focus-within):not(:disabled) {
			cursor: pointer;
		}
	}

	.add-block {
		position: relative;
		display: block;
		width: 100%;
		text-align: start;
		margin: 5px 0;
		padding: 8px 0;
		color: transparent;
		transition: color 100ms ease-out;

		&:is(:hover):not(:disabled) {
			color: hsl(0, 0%, 90%);
		}

		& > :global(svg) {
			position: absolute;
			right: calc(100% + 5px);
			top: 50%;
			transform: translate(0, -50%);
		}

		&::before {
			content: '';
			display: block;
			width: 100%;
			height: 2px;
			background-color: currentColor;
		}
	}
</style>
