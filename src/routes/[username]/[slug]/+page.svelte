<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { deleteNotebook, like, updateBlocks } from '$lib/client/requests/notebooks';
	import { confirm } from '$lib/cmpnt/Confirmation.svelte';
	import ProfilePicture from '$lib/cmpnt/ProfilePicture.svelte';
	import Select from '$lib/cmpnt/Select.svelte';
	import BranchFork from '$lib/cmpnt/svg/branch-fork.svelte';
	import DotsThree from '$lib/cmpnt/svg/dots-three.svelte';
	import Eye from '$lib/cmpnt/svg/eye.svelte';
	import FloppyDiskBack from '$lib/cmpnt/svg/floppy-disk-back.svelte';
	import Globe from '$lib/cmpnt/svg/globe.svelte';
	import PencilSimpleLine from '$lib/cmpnt/svg/pencil-simple-line.svelte';
	import TagIcon from '$lib/cmpnt/svg/tag.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import Tag from '$lib/cmpnt/Tag.svelte';
	import Visibility from '$lib/cmpnt/Visibility.svelte';
	import { PreventNavigation } from '$lib/navigation.svelte';
	import type { ExecutionWithResultURL } from '$lib/server/proxy';
	import type { Block, EditionBlock } from '$lib/server/repositories/blocks';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { Tag as NotebookTag } from '$lib/server/repositories/tags';
	import type { PageProps } from './$types';
	import AddBlock from './AddBlock.svelte';
	import Cell from './Cell.svelte';
	import ForkModal from './ForkModal.svelte';
	import LikeButton from './LikeButton.svelte';
	import RenameModal from './RenameModal.svelte';
	import SetTagsModal from './SetTagsModal.svelte';
	import ShareModal from './ShareModal.svelte';
	import { areSameBlocks } from './utils';

	let { data }: PageProps = $props();

	let moreNotebookSelect = $state<ReturnType<typeof Select>>();

	let notebook = $derived(selectNotebook(data.notebook));
	function selectNotebook(n: PageProps['data']['notebook']): Notebook {
		const { author, blocks, likes, tags, ...notebook } = n;
		return notebook;
	}

	let likes = $derived(data.notebook.likes);
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

	let tags = $derived(data.notebook.tags);

	let blocks = $state<(EditionBlock & { executions?: ExecutionWithResultURL[] })[]>(
		data.notebook.blocks.slice()
	);
	$effect(() => {
		blocks = data.notebook.blocks.slice();
	});

	const lastUpdate = $derived.by(() => {
		return blocks.reduce(
			(acc, b) => (b.updatedAt && b.updatedAt.getTime() > acc.getTime() ? b.updatedAt : acc),
			notebook.updatedAt
		);
	});

	function handleAdd(type: EditionBlock['type'], at: number) {
		blocks.splice(at, 0, {
			content: '',
			type,
			pinned: false,
			position: 0,
			metadata: type === 'sql' ? { type: 'table' } : null
		});
	}

	const blocker = new PreventNavigation();
	let loading = $state(false);
	async function save(toUpdate: typeof blocks) {
		if (areSameBlocks(data.notebook.blocks, toUpdate)) return;
		if (loading) return;
		loading = true;
		try {
			const positionned = toUpdate.map((b, i) => ({ ...b, position: i }));
			const updated = await updateBlocks(data.notebook.id, positionned);
			if (updated) {
				blocker.prevent = false;
				blocks.forEach((block, i) => {
					const next = updated[i];
					block.id = next.id;
					block.notebookId = next.notebookId;
					block.createdAt = next.createdAt;
					block.updatedAt = next.updatedAt;
					block.position = next.position;
					block.pinned = next.pinned;
					block.metadata = next.metadata;
				});

				data.notebook.blocks = $state.snapshot(blocks) as Block[];
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!data.isEditable) return;
		blocker.prevent = !areSameBlocks(data.notebook.blocks, $state.snapshot(blocks));
	});

	function handleWindowKeydown(e: KeyboardEvent) {
		const isMac = navigator.userAgent.includes('Macintosh');
		const mod = isMac ? e.metaKey : e.ctrlKey;

		if (mod && e.key === 's') {
			if (!data.isEditable) return;
			e.preventDefault();
			save($state.snapshot(blocks));
		}
	}

	let shareModal: ReturnType<typeof ShareModal>;
	let renameModal: ReturnType<typeof RenameModal>;
	let setTagsModal: ReturnType<typeof SetTagsModal>;
	let forkModal: ReturnType<typeof ForkModal>;

	async function handleDelete() {
		moreNotebookSelect?.close();
		const confirmed = await confirm({
			title: 'Delete Notebook',
			description: `This action cannot be undone. This will permanently delete the <b>${notebook.title}</b> Notebook.`,
			buttons: { confirm: 'Delete' },
			danger: true
		});

		if (confirmed) {
			const deleted = await deleteNotebook(notebook.id);
			if (deleted) {
				blocker.prevent = false;
				goto('/');
			}
		}
	}

	function tagHref(tag: NotebookTag['name']) {
		const url = new URL(page.url.origin);
		url.searchParams.set('q', `#${tag}`);
		return url.toString();
	}
</script>

<svelte:head>
	<title>{data.notebook.author.username}/{data.notebook.title}</title>
	<meta
		name="description"
		content="Dive into this data notebook on Degen: {data.notebook
			.title}. Explore SQL queries, visual insights, and powerful datasets crafted by data lovers!"
	/>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<header>
	<div class="author">
		<ProfilePicture user={data.notebook.author} size={32} />
		<div class="username">
			<a href="/{data.notebook.author.username}">{data.notebook.author.username}</a>
		</div>
	</div>

	<div class="notebook-actions">
		<button
			class="share"
			aria-label="Open Share modal"
			title="Open Share modal"
			onclick={() => shareModal.show()}
		>
			<Globe size="16" />Share...
		</button>
		<LikeButton
			disabled={data.isEditable || !data.authenticated}
			likes={likeCount}
			max={10}
			{userLike}
			onLike={handleLike}
		/>
		{#if data.authenticated}
			<button
				class="fork"
				title="Fork this notebook"
				aria-label="Fork this notebook"
				onclick={() => forkModal.show()}
			>
				<BranchFork size="16" />
			</button>
		{/if}
		{#if data.isEditable}
			<button
				title="Save"
				aria-label="Save"
				class="save"
				onclick={() => save($state.snapshot(blocks))}
			>
				<FloppyDiskBack size="16" />
			</button>
			<button
				class="more"
				aria-label="More"
				onclick={(e) => moreNotebookSelect?.open(e.currentTarget)}
			>
				<DotsThree size="16" />
			</button>
			<Select bind:this={moreNotebookSelect} placement="bottom-end">
				<ul role="menu" class="share-select">
					<li>
						<button
							onclick={() => {
								renameModal.show();
								moreNotebookSelect?.close();
							}}
						>
							<PencilSimpleLine size="14" />Rename
						</button>
					</li>
					<li>
						<button
							onclick={() => {
								setTagsModal.show();
								moreNotebookSelect?.close();
							}}
						>
							<TagIcon size="14" />Set tags
						</button>
					</li>
					<li><span class="separator"></span></li>
					<li>
						<button class="danger" onclick={handleDelete}>
							<Trash size="14" />Delete
						</button>
					</li>
				</ul>
			</Select>
		{/if}
	</div>
</header>
<ShareModal
	notebook={{ ...notebook, author: data.notebook.author }}
	onSuccess={async (n) => {
		if (notebook.slug !== n.slug) {
			blocker.prevent = false;
			await goto(`/${data.notebook.author.username}/${n.slug}`, { replaceState: true });
		}

		notebook = n;
	}}
	bind:this={shareModal}
	disabled={!data.isEditable}
/>
<RenameModal {notebook} onSuccess={(n) => (notebook = n)} bind:this={renameModal} />
<SetTagsModal {notebook} {tags} onSuccess={(_tags) => (tags = _tags)} bind:this={setTagsModal} />
<ForkModal
	{notebook}
	onSuccess={(n) => ((blocker.prevent = false), goto(`/${n.author.username}/${n.slug}`))}
	bind:this={forkModal}
/>

<div class="notebook-info">
	<Visibility visibility={notebook.visibility} />
	<div class="author">
		By <a href="/{data.notebook.author.username}">@{data.notebook.author.username}</a>
	</div>
	<div class="updated_at">
		<PencilSimpleLine size="16" />
		<span title="Edited {notebook.updatedAt.toString()}">
			Edited {lastUpdate.toDateString()}
		</span>
	</div>
	{#if data.notebook.forkOf}
		{@const fork = data.notebook.forkOf}
		<div class="fork_of">
			<BranchFork size="16" />
			<span>
				Fork of
				<a title={fork.title} href="/{fork.author.username}/{fork.slug}">
					{fork.title}
				</a>
			</span>
		</div>
	{/if}
	{#if data.notebook.views}
		<div class="views">
			<Eye size="16" />
			<span>{data.notebook.views} view{data.notebook.views > 1 ? 's' : ''}</span>
		</div>
	{/if}
</div>

{#if tags.length}
	<div class="tags">
		{#each tags as tag}
			<a href={tagHref(tag.name)}>
				<Tag name={tag.name} />
			</a>
		{/each}
	</div>
{/if}

<hr class:mx-bottom={!data.isEditable} />

{#if data.isEditable}
	<AddBlock onNewBlock={(type) => handleAdd(type, 0)} />
{/if}
{#each blocks as block, i (block)}
	<Cell bind:block={blocks[i]} onDelete={() => blocks.splice(i, 1)} readonly={!data.isEditable} />
	{#if data.isEditable}
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

		& > div {
			display: flex;
			align-items: center;
			gap: 4px;

			& > :global(svg) {
				color: hsl(0, 0%, 65%);
			}
		}
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		margin: 8px 0;
		padding-bottom: 16px;
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
