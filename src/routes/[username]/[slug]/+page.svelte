<script lang="ts">
	import Plus from '$lib/cmpnt/svg/plus.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import type { EditionBlock } from '$lib/server/repositories/blocks';
	import debounce from 'p-debounce';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import Block from './Block.svelte';
	import { updateBlocks } from './requests';

	let { data }: PageProps = $props();
	let blocks = $state<EditionBlock[]>(data.notebook.blocks);
	$effect.pre(() => {
		if (untrack(() => blocks.length) === 0) {
			blocks.push({
				content: `# @${data.notebook.author.username}/${data.notebook.title}`,
				type: 'markdown',
				pinned: false,
				position: 0
			});
		}
	});

	async function save(nextBlocks: EditionBlock[]) {
		const positionned = nextBlocks.map((b, i) => ({ ...b, position: i }));
		const updated = await updateBlocks(data.notebook.id, positionned);
		if (updated) blocks = updated;
	}

	const debouncedSave = debounce(save, 2_000);
	const automatic_save = false;
	$effect(() => {
		if (data.canEdit && automatic_save) debouncedSave($state.snapshot(blocks));
	});

	function handleKeyDown(e: KeyboardEvent) {
		const isMac = navigator.userAgent.includes('Macintosh');
		const mod = isMac ? e.metaKey : e.ctrlKey;

		if (mod && e.key === 's') {
			if (!data.canEdit) return;
			e.preventDefault();
			debouncedSave($state.snapshot(blocks));
		}
	}

	function handleAdd(index: number) {
		const block: EditionBlock = { content: ``, type: 'markdown', pinned: false, position: 0 };
		blocks.splice(index, 0, block);
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<section>
	{#if data.canEdit}
		<header>
			<button onclick={() => save($state.snapshot(blocks))}>Save</button>
		</header>
	{/if}
	{#each blocks as block, i (block)}
		<article>
			{#if blocks.length > 1 && data.canEdit}
				<button class="trash" onclick={() => blocks.splice(i, 1)}><Trash size="14" /></button>
			{/if}
			<Block bind:value={block.content} />
		</article>
		{#if data.canEdit}
			<button class="add-block" onclick={() => handleAdd(i + 1)}>
				<Plus size="14" />
			</button>
		{/if}
	{/each}
</section>

<style>
	section {
		max-width: 1024px;
		margin: 0 auto;
		padding: 20px 24px;
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

	article {
		position: relative;

		&::before {
			content: '';
			position: absolute;

			width: 20px;
			right: calc(100% + 4px);
			top: 0;
			bottom: 0;
			background-color: transparent;
		}

		&:is(:hover, :focus-within)::before {
			background-color: hsl(0, 0%, 12%);
		}
	}

	button.trash {
		padding: 0;
		position: absolute;
		top: 0;
		right: 100%;
		transform: translate(-50%, 50%);
		color: hsl(0, 0%, 80%);

		&:is(:hover):not(:disabled) {
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
		color: hsl(0, 0%, 80%);
		transition: color 100ms ease-out;

		&:is(:hover):not(:disabled) {
			color: hsl(0, 0%, 90%);

			&::before {
				background-color: currentColor;
			}
		}

		& > :global(svg) {
			position: absolute;
			right: 100%;
			top: 50%;
			transform: translate(-50%, -50%);
		}

		&::before {
			content: '';
			display: block;
			width: 100%;
			height: 2px;
			background-color: transparent;
		}
	}
</style>
