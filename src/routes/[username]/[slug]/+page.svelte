<script lang="ts">
	import { goto } from '$app/navigation';
	import { confirm } from '$lib/cmpnt/Confirmation.svelte';
	import Select from '$lib/cmpnt/Select.svelte';
	import DotsThree from '$lib/cmpnt/svg/dots-three.svelte';
	import FloppyDiskBack from '$lib/cmpnt/svg/floppy-disk-back.svelte';
	import Globe from '$lib/cmpnt/svg/globe.svelte';
	import PencilSimpleLine from '$lib/cmpnt/svg/pencil-simple-line.svelte';
	import Profile from '$lib/cmpnt/svg/profile.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import Visibility from '$lib/cmpnt/Visibility.svelte';
	import type { EditionBlock } from '$lib/server/repositories/blocks';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { PageProps } from './$types';
	import AddBlock from './AddBlock.svelte';
	import Cell from './Cell.svelte';
	import LikeButton from './LikeButton.svelte';
	import RenameModal from './RenameModal.svelte';
	import { deleteNotebook, like, updateBlocks } from './requests';
	import ShareModal from './ShareModal.svelte';

	let { data }: PageProps = $props();

	let moreNotebookSelect: ReturnType<typeof Select>;

	let notebook = $state.raw(selectNotebook(data.notebook));
	function selectNotebook(n: PageProps['data']['notebook']): Notebook {
		const { author, blocks, likes, ...notebook } = n;
		return notebook;
	}
	let likes = $state.raw(data.notebook.likes);
	let likeCount = $derived(likes.reduce((a, k) => a + k.count, 0));
	let userLike = $derived(likes.find((l) => l.userId === data.user?.id));
	async function handleLike(count: number) {
		const l = await like(notebook.id, count);
		if (l) {
			const index = likes.findIndex((li) => li.userId === l!.userId);
			if (index === -1) likes = likes.concat(l);
			else likes = likes.with(index, l);
		}
	}

	let blocks = $state<(EditionBlock | (typeof data.notebook.blocks)[number])[]>(
		data.notebook.blocks.slice()
	);

	const lastUpdate = $derived.by(() => {
		return blocks.reduce(
			(acc, b) => (b.updatedAt && b.updatedAt.getTime() > acc.getTime() ? b.updatedAt : acc),
			notebook.updatedAt
		);
	});

	function handleAdd(type: EditionBlock['type'], at: number) {
		blocks.splice(at, 0, { content: '', type, pinned: false, position: 0 });
	}

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
	let renameModal: ReturnType<typeof RenameModal>;

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
	<title>{data.notebook.author.username}/{data.notebook.title}</title>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<header>
	<div class="author">
		<Profile handle={data.notebook.author.username} size={32} />
		<div class="username">
			<a href="/{data.notebook.author.username}">{data.notebook.author.username}</a>
		</div>
	</div>

	<div class="notebook-actions">
		<button class="share" onclick={() => shareModal.show()}>
			<Globe size="16" />Share...
		</button>
		{#if data.isAuthor}
			<button class="save" onclick={() => save($state.snapshot(blocks))}>
				<FloppyDiskBack size="16" />
			</button>
		{/if}
		<LikeButton
			disabled={data.isAuthor || !data.user}
			likes={likeCount}
			max={10}
			{userLike}
			onLike={handleLike}
		/>
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
				{#if data.isAuthor}
					<li>
						<button
							onclick={() => {
								renameModal.show();
								moreNotebookSelect.close();
							}}
						>
							<PencilSimpleLine size="14" />Rename
						</button>
					</li>
					<li><span class="separator"></span></li>
					<li>
						<button class="danger" onclick={handleDelete}>
							<Trash size="14" />Delete
						</button>
					</li>
				{/if}
			</ul>
		</Select>
	</div>
</header>
<ShareModal
	{notebook}
	onSuccess={(n) => (notebook = n)}
	bind:this={shareModal}
	disabled={!data.isAuthor}
/>
<RenameModal {notebook} onSuccess={(n) => (notebook = n)} bind:this={renameModal} />

<div class="notebook-info">
	<Visibility visibility={notebook.visibility} />
	<div class="author">
		By <a href="/{data.notebook.author.username}">@{data.notebook.author.username}</a>
	</div>
	<div class="updated_at">
		<PencilSimpleLine size="16" /><span title="Edited {notebook.updatedAt.toString()}">
			Edited {lastUpdate.toDateString()}
		</span>
	</div>
</div>

<hr class:mx-bottom={!data.isAuthor} />

{#if data.isAuthor}
	<AddBlock onNewBlock={(type) => handleAdd(type, 0)} />
{/if}
{#each blocks as block, i (block)}
	<Cell bind:block={blocks[i]} onDelete={() => blocks.splice(i, 1)} readonly={!data.isAuthor} />
	{#if data.isAuthor}
		<AddBlock onNewBlock={(type) => handleAdd(type, i + 1)} />
	{/if}
{/each}

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

		&.mx-bottom {
			margin-bottom: 20px;
		}
	}

	a:hover {
		color: hsl(224 60% 54%);
	}
</style>
