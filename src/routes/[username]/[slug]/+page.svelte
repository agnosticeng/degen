<script lang="ts">
	import { goto } from '$app/navigation';
	import { confirm } from '$lib/cmpnt/Confirmation.svelte';
	import Select from '$lib/cmpnt/Select.svelte';
	import CaretDown from '$lib/cmpnt/svg/caret-down.svelte';
	import DotsThreeVertical from '$lib/cmpnt/svg/dots-three-vertical.svelte';
	import DotsThree from '$lib/cmpnt/svg/dots-three.svelte';
	import FloppyDiskBack from '$lib/cmpnt/svg/floppy-disk-back.svelte';
	import Globe from '$lib/cmpnt/svg/globe.svelte';
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import PencilSimpleLine from '$lib/cmpnt/svg/pencil-simple-line.svelte';
	import Pin from '$lib/cmpnt/svg/pin.svelte';
	import Profile from '$lib/cmpnt/svg/profile.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import type { EditionBlock } from '$lib/server/repositories/blocks';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { PageProps } from './$types';
	import AddBlock from './AddBlock.svelte';
	import Block from './Block.svelte';
	import ShareModal from './ShareModal.svelte';
	import Visibility from './Visibility.svelte';
	import { deleteNotebook, updateBlocks } from './requests';

	let { data }: PageProps = $props();

	let moreNotebookSelect: ReturnType<typeof Select>;

	let notebook = $state.raw(selectNotebook(data.notebook));
	function selectNotebook(n: PageProps['data']['notebook']): Notebook {
		const { author, blocks, likes, ...notebook } = n;
		return notebook;
	}
	let likes = $state(data.notebook.likes);
	let likeCount = $derived(likes.reduce((a, k) => a + k.count, 0));
	let liked = $derived(likes.some((l) => l.userId === data.authenticatedUser.id));
	let canLike = $derived(
		(likes.find((l) => l.userId === data.authenticatedUser.id)?.count ?? 0) < 10 && !data.isAuthor
	);

	let blocks = $state<(EditionBlock & { open?: boolean })[]>(data.notebook.blocks.slice());
	const lastUpdate = $derived.by(() => {
		return blocks.reduce(
			(acc, b) => (b.updatedAt && b.updatedAt.getTime() > acc.getTime() ? b.updatedAt : acc),
			notebook.updatedAt
		);
	});

	function handleAdd(type: EditionBlock['type'], at: number) {
		blocks.splice(at, 0, { content: '', type, pinned: false, position: 0, open: true });
	}

	let blockSelects = $state<ReturnType<typeof Select>[]>([]);
	$effect(() => {
		const filtered = blockSelects.filter(Boolean);
		if (filtered.length !== blockSelects.length) blockSelects = filtered;
	});

	async function save(toUpdate: typeof blocks) {
		const positionned = toUpdate.map((b, i) => ({ ...b, position: i }));
		const updated = await updateBlocks(data.notebook.id, positionned);
		if (updated) {
			data.notebook.blocks = updated;
			blocks.forEach((block, i) => {
				const next = updated[i];
				block.id = next.id;
				block.notebookId = next.notebookId;
				block.createdAt = next.createdAt;
				block.updatedAt = next.updatedAt;
				block.position = next.position;
				block.pinned = next.pinned;
			});
		}
	}

	function handleWindowKeydown(e: KeyboardEvent) {
		const isMac = navigator.userAgent.includes('Macintosh');
		const mod = isMac ? e.metaKey : e.ctrlKey;

		if (mod && e.key === 's') {
			if (!data.isAuthor) return;
			e.preventDefault();
			save($state.snapshot(blocks));
		}
	}

	let shareModal: ReturnType<typeof ShareModal>;

	async function handleDelete() {
		moreNotebookSelect.close();
		const confirmed = await confirm({
			title: 'Delete Notebook',
			description: `This action cannot be undone. This will permanently delete the <b>${notebook.title}</b> Notebook.`,
			buttons: { confirm: 'Delete' },
			danger: true
		});

		if (confirmed) {
			const deleted = await deleteNotebook(notebook.id);
			if (deleted) goto('/');
		}
	}
</script>

<svelte:head>
	<title>@{data.notebook.author.username}/{data.notebook.title}</title>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<header>
	<div class="author">
		<Profile handle={data.notebook.author.username} size={32} />
		<div class="username">@{data.notebook.author.username}</div>
	</div>

	<div class="notebook-actions">
		<button class="share" onclick={(e) => shareModal.show()}>
			<Globe size="16" />Share...
		</button>
		{#if data.isAuthor}
			<button class="save" onclick={() => save($state.snapshot(blocks))}>
				<FloppyDiskBack size="16" />
			</button>
		{/if}
		<button class="like" class:full={liked} disabled={!canLike}>
			<Heart size="16" fill={liked ? 'currentColor' : 'none'} />{likeCount}
		</button>
		<button class="more" onclick={(e) => moreNotebookSelect.open(e.currentTarget)}>
			<DotsThree size="16" />
		</button>
		<Select bind:this={moreNotebookSelect} placement="bottom-end">
			<ul role="menu" class="share-select">
				<li>
					<button
						onclick={() => {
							shareModal.show();
							moreNotebookSelect.close();
						}}
					>
						<Globe size="14" />Share...
					</button>
				</li>
				<li>
					<span class="separator"></span>
				</li>
				<li>
					<button class="danger" disabled={!data.isAuthor} onclick={handleDelete}>
						<Trash size="14" />Delete
					</button>
				</li>
			</ul>
		</Select>
	</div>
</header>
<ShareModal {notebook} onSuccess={(n) => (notebook = n)} bind:this={shareModal} />

<div class="notebook-info">
	<Visibility visibility={notebook.visibility} />
	<div class="author">By @{data.notebook.author.username}</div>
	<div class="updated_at">
		<PencilSimpleLine size="16" /><span title="Edited {notebook.updatedAt.toString()}">
			Edited {lastUpdate.toDateString()}
		</span>
	</div>
</div>

<hr />

<AddBlock onNewBlock={(type) => handleAdd(type, 0)} />
{#each blocks as block, i (block)}
	<article>
		<div class="edit-bar">
			{#if data.isAuthor}
				<button class="more" onclick={(e) => blockSelects.at(i)?.open(e.currentTarget)}>
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
	<AddBlock onNewBlock={(type) => handleAdd(type, i + 1)} />
{/each}

{#snippet more(block: EditionBlock, i: number)}
	<Select bind:this={blockSelects[i]} placement="right-start">
		<ul role="menu">
			<li role="menuitem">
				<button
					onclick={() => {
						block.pinned = !block.pinned;
						blockSelects[i].close();
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
				<button class="danger" onclick={() => blocks.splice(i, 1)}>
					<Trash size="14" /> Delete
				</button>
			</li>
		</ul>
	</Select>
{/snippet}

<style>
	header {
		width: 100%;
		margin: 16px 0 8px;

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

		& > div.notebook-actions {
			flex-shrink: 0;

			display: flex;
			align-items: center;
			gap: 5px;

			& > button {
				padding: 8px;
				display: flex;
				align-items: center;
				gap: 8px;
				height: 34px;
				min-width: 34px;
				border: 1px solid hsl(0, 0%, 15%);
				border-radius: 4px;
				color: hsl(0, 0%, 80%);
				font-weight: 500;

				&:is(:hover):not(:disabled) {
					background-color: hsl(0, 0%, 12%);
					color: hsl(0, 0%, 90%);
				}

				&:is(:active):not(:disabled) {
					background-color: hsl(0, 0%, 15%);
				}

				&:is(:disabled) {
					color: hsl(0, 0%, 64%);
					border-color: transparent;
				}
			}

			.like.full > :global(svg) {
				color: hsl(0deg 61% 54%);
			}
		}
	}

	ul[role='menu'] {
		list-style: none;
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;

		& > li {
			display: block;
			padding: 0;

			& > span.separator {
				display: block;
				width: 100%;
				height: 1px;
				margin: 4px 0;
				background-color: hsl(0, 0%, 15%);
			}

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

	.notebook-info {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		margin: 8px 0;
		padding: 16px 0;

		& .updated_at {
			display: flex;
			align-items: center;
			gap: 4px;

			& > :global(svg) {
				color: hsl(0, 0%, 65%);
			}
		}
	}

	hr {
		border-color: hsl(0, 0%, 15%);
		border-width: 0.5px;
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
			border-radius: 4px;

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

				&.chevron {
					transition: transform 0.2s ease;

					&.rotate {
						transform: rotate(-90deg);
					}
				}
			}
		}

		&:is(:hover, :focus-within) > .edit-bar {
			background-color: hsl(0, 0%, 12%);
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
</style>
