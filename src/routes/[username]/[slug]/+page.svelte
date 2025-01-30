<script lang="ts">
	import Select from '$lib/cmpnt/Select.svelte';
	import CaretDown from '$lib/cmpnt/svg/caret-down.svelte';
	import DotsThreeVertical from '$lib/cmpnt/svg/dots-three-vertical.svelte';
	import Pin from '$lib/cmpnt/svg/pin.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import type { EditionBlock } from '$lib/server/repositories/blocks';
	import debounce from 'p-debounce';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import AddBlock from './AddBlock.svelte';
	import Block from './Block.svelte';
	import { updateBlocks } from './requests';

	let { data }: PageProps = $props();
	let blocks = $state<(EditionBlock & { open?: boolean })[]>(data.notebook.blocks);

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
		if (data.isAuthor && automatic_save) debouncedSave($state.snapshot(blocks));
	});

	function handleKeyDown(e: KeyboardEvent) {
		const isMac = navigator.userAgent.includes('Macintosh');
		const mod = isMac ? e.metaKey : e.ctrlKey;

		if (mod && e.key === 's') {
			if (!data.isAuthor) return;
			e.preventDefault();
			debouncedSave($state.snapshot(blocks));
		}
	}

	function handleAdd(type: EditionBlock['type'], at: number) {
		blocks.splice(at, 0, { content: '', type, pinned: false, position: 0, open: true });
	}

	let selects = $state<ReturnType<typeof Select>[]>([]);
	$effect(() => {
		const filtered = selects.filter(Boolean);
		if (filtered.length !== selects.length) selects = filtered;
	});
</script>

<svelte:head>
	<title>@{data.notebook.author.username}/{data.notebook.title}</title>
</svelte:head>

<svelte:window onkeydown={handleKeyDown} />

{#snippet more(block: EditionBlock, i: number)}
	<Select bind:this={selects[i]} placement="right-start">
		<ul role="menu">
			<li role="menuitem">
				<button
					onclick={() => {
						block.pinned = !block.pinned;
						selects[i].close();
					}}
				>
					<Pin size="14" />
					{#if block.pinned}
						Unpin
					{:else}
						Pin
					{/if}
				</button>
			</li>
			<li role="menuitem">
				<button class="danger" disabled={blocks.length === 1} onclick={() => blocks.splice(i, 1)}>
					<Trash size="14" /> Delete
				</button>
			</li>
		</ul>
	</Select>
{/snippet}

<section>
	<header>
		{#if data.isAuthor}
			<button onclick={() => save($state.snapshot(blocks))}>Save</button>
		{/if}
	</header>
	{#each blocks as block, i (block)}
		<article>
			<div class="edit-bar">
				{#if data.isAuthor}
					<button class="more" onclick={(e) => selects.at(i)?.open(e.currentTarget)}>
						<DotsThreeVertical size="14" />
					</button>
					{@render more(block, i)}
				{/if}
				<button
					class="chevron"
					class:rotate={!block.open && !block.pinned}
					onclick={() => (block.open = !block.open)}
				>
					<CaretDown size="14" />
				</button>
			</div>
			<Block
				bind:value={block.content}
				type={block.type}
				readonly={!data.isAuthor}
				open={block.open || block.pinned}
			/>
		</article>
		{#if data.isAuthor}
			<AddBlock onNewBlock={(type) => handleAdd(type, i + 1)} />
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
		min-height: calc(2 * (18px + 8px));

		& > .edit-bar {
			position: absolute;
			top: 0;
			bottom: 0;
			right: 100%;
			width: 24px;
			padding: 8px 0;

			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;

			background-color: transparent;

			& > button {
				height: 18px;
				aspect-ratio: 1;

				display: flex;
				align-items: center;
				justify-content: center;

				color: hsl(0, 0%, 80%);

				&:is(:hover):not(:disabled) {
					color: hsl(0, 0%, 90%);
				}
			}
		}

		&:is(:hover, :focus-within) > .edit-bar {
			background-color: hsl(0, 0%, 12%);
		}
	}

	button.chevron {
		transition: transform 0.2s ease;

		&.rotate {
			transform: rotate(-90deg);
		}
	}

	button {
		appearance: none;
		outline: none;
		border: none;
		background-color: transparent;
		color: currentColor;
		padding: 0;

		&:is(:hover, :focus-within):not(:disabled) {
			cursor: pointer;
		}
	}

	ul {
		list-style: none;
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;

		& > li {
			display: block;
			padding: 0;

			& > button {
				width: 100%;
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 16px;
				color: hsl(0, 0%, 80%);

				&:is(:hover, :focus-within):not(:disabled) {
					color: hsl(0, 0%, 90%);
					background-color: hsl(0, 0%, 15%);

					&.danger {
						color: hsl(0deg 61% 54%);
						background-color: hsl(0, 34%, 12%);
					}
				}

				&:is(:disabled) {
					color: hsl(0, 0%, 65%);
				}
			}
		}
	}
</style>
