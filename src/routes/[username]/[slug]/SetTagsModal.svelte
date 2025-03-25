<script lang="ts">
	import { autoresize } from '$lib/actions/autoresize.svelte';
	import { setTags } from '$lib/client/requests/notebooks';
	import { getAlltags } from '$lib/client/requests/tags';
	import Autocomplete from '$lib/cmpnt/Autocomplete.svelte';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import TagIcon from '$lib/cmpnt/svg/tag.svelte';
	import X from '$lib/cmpnt/svg/x.svelte';
	import Tag from '$lib/cmpnt/Tag.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { NewTag, Tag as NotebookTag } from '$lib/server/repositories/tags';
	import { tick } from 'svelte';

	interface Props {
		notebook: Notebook;
		tags: NotebookTag[];
		onSuccess?: (tags: NotebookTag[]) => void;
	}

	let { notebook, tags: _tags, onSuccess }: Props = $props();
	let tags = $state.raw<NewTag[]>(_tags);
	let tagNames = $derived(tags.map((t) => t.name));

	let modal = $state<ReturnType<typeof Modal>>();
	let open = $state(false);

	export function show() {
		open = true;
		tags = _tags;
	}

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const updated = await setTags(notebook.id, tags ?? []);

		if (updated) {
			onSuccess?.(updated);
			modal?.close();
		}
	}

	function remove(i: number) {
		tags = tags.toSpliced(i, 1);
		filter = '';
	}

	let input = $state<HTMLInputElement>();
	let autocompletions = $state.raw<NotebookTag[]>([]);
	let filter = $state('');
	let autocomplete = $state<ReturnType<typeof Autocomplete>>();
	const filteredTags = $derived.by<NewTag[]>(() => {
		const filtered = autocompletions.filter(
			(tag) => !tagNames.includes(tag.name) && tag.name.toLowerCase().includes(filter.toLowerCase())
		);

		return [{ name: filter }, ...filtered].filter((t) => !!t.name);
	});

	$effect(() => void getAlltags().then((t) => (autocompletions = t ?? [])));

	async function handleSelectTag(tag: NewTag) {
		tags = tags.concat(tag);
		await tick();
		if (!filteredTags.length) autocomplete?.close();
	}

	function handleKeydown(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		if ((e.code === 'Space' || e.code === 'Enter') && input?.value.trim()) {
			e.preventDefault();
			if (!tagNames.includes(input.value.trim())) tags = tags.concat({ name: input.value.trim() });
			filter = '';
			return;
		}

		if (e.code === 'Backspace' && e.currentTarget.value.trim().length === 0) {
			tags = tags.slice(0, -1);
		}
	}

	$effect(() => {
		if (tags.length === 5) autocomplete?.close();
	});
</script>

{#if open}
	<Modal bind:this={modal} onclose={() => (open = false)}>
		<form onsubmit={handleSubmit}>
			<h1><TagIcon size="24" /> Edit tags</h1>
			<div
				class="form-group"
				role="presentation"
				onclick={(e) => {
					e.stopPropagation();
					input?.focus();
				}}
			>
				<span>Tags<span>(separate with spaces)</span></span>
				<div class="topics">
					{#each tags as tag, i (tag.name)}
						<span class="topic">
							<Tag name={tag.name} disabled />
							<button type="button" onclick={() => remove(i)}><X size="12" /></button>
						</span>
					{/each}
					<input
						use:autoresize
						type="text"
						disabled={tags.length === 5}
						bind:this={input}
						bind:value={filter}
						onkeydown={handleKeydown}
						onfocus={() => autocomplete?.open()}
					/>
					<Autocomplete
						anchor={input?.parentElement}
						items={filteredTags}
						bind:this={autocomplete}
						flip={false}
					>
						{#snippet item(tag)}
							<button
								type="button"
								class="autocomplete-button"
								onclick={() => handleSelectTag(tag)}
							>
								#{tag.name}
							</button>
						{/snippet}
					</Autocomplete>
				</div>
			</div>
			<div class="actions">
				<button class="cancel" type="button" onclick={() => modal?.close()}>Cancel</button>
				<button type="submit">Save</button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	:global(dialog):has(form) {
		overflow: visible;
	}

	button.autocomplete-button {
		padding: 8px 16px;
		width: 100%;
		text-align: start;
		font-weight: 500;
		background-color: hsl(0, 0%, 7%);

		&:hover {
			background-color: hsl(0, 0%, 10%);
		}
	}

	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: #dbdbdb;
		border-radius: 6px;
	}

	h1 {
		margin: 0 0 12px;
		font-size: 18px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.form-group {
		display: block;
		margin-bottom: 16px;

		& > span {
			font-size: 12px;
			display: block;
			margin-bottom: 8px;

			& > span {
				color: hsl(214deg 8% 60%);
				padding-left: 5px;
			}
		}
	}

	div.topics {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		background-color: hsl(0deg 0% 3%);
		padding: 8px 12px;
		border-radius: 5px;
		border: 1px solid hsl(0deg 0% 20%);
	}

	span.topic {
		background-color: hsl(0, 0%, 10%);
		padding: 0 4px 0 0;
		border-radius: 4px;
		font-weight: 400;
		transition: all 0.2s ease;
		font-size: 12px;
		line-height: 16px;
		display: flex;
		align-items: center;

		& > button {
			margin-left: 6px;
			height: 100%;
			aspect-ratio: 1;
			display: flex;
			align-items: center;

			&:hover {
				color: hsl(0, 0%, 90%);
			}
		}
	}

	input {
		width: 10px;
		background-color: hsl(0deg 0% 3%);
		border: none;
		border-radius: 5px;
		outline: none;
		height: 30px;

		&:disabled {
			display: none;
		}
	}

	div.actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		height: 28px;
		margin-top: 12px;
	}

	div.actions button {
		font-weight: 500;
		border: none;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background-color: transparent;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;

		&[type='submit'] {
			background-color: hsl(0, 0%, 12%);
		}

		&:not(:disabled):hover {
			background-color: hsl(0, 0%, 15%);
			color: hsl(0, 0%, 90%);
		}

		&:disabled {
			background-color: hsl(0, 0%, 26%);
			color: hsl(0, 0%, 65%);
		}
	}
</style>
