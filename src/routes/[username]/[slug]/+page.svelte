<script lang="ts">
	import Select from '$lib/cmpnt/Select.svelte';
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

	function handleAdd(type: EditionBlock['type'], at: number) {
		const block: EditionBlock = { content: ``, type, pinned: false, position: 0 };
		blocks.splice(at, 0, block);
	}

	let selects = $state<ReturnType<typeof Select>[]>([]);
	$effect(() => {
		const filtered = selects.filter(Boolean);
		if (filtered.length !== selects.length) selects = filtered;
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<section>
	<header>
		{#if data.canEdit}
			<button onclick={() => save($state.snapshot(blocks))}>Save</button>
		{/if}
	</header>
	{#each blocks as block, i (block)}
		<article>
			{#if data.canEdit}
				<button class="more" onclick={(e) => selects.at(i)?.open(e.currentTarget)}>
					<DotsThreeVertical size="14" />
				</button>
				<Select bind:this={selects[i]} placement="right-start">
					<ul role="menu">
						<li role="menuitem">
							<button onclick={() => (block.pinned = !block.pinned)}>
								<Pin size="14" />
								{#if block.pinned}
									Unpin
								{:else}
									Pin
								{/if}
							</button>
						</li>
						<li role="menuitem">
							<button
								class="danger"
								disabled={blocks.length === 1}
								onclick={() => blocks.splice(i, 1)}
							>
								<Trash size="14" /> Delete
							</button>
						</li>
					</ul>
				</Select>
			{/if}
			<Block bind:value={block.content} type={block.type} readonly={!data.canEdit} />
		</article>
		{#if data.canEdit}
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

	button.more {
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
