<script lang="ts">
	import { setTags } from '$lib/client/requests/notebooks';
	import { getAlltags } from '$lib/client/requests/tags';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import TagIcon from '$lib/cmpnt/svg/tag.svelte';
	import X from '$lib/cmpnt/svg/x.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { NewTag, Tag } from '$lib/server/repositories/tags';
	import { tick } from 'svelte';

	interface Props {
		notebook: Notebook;
		tags: Tag[];
		onSuccess?: (tags: Tag[]) => void;
	}

	let { notebook, tags: _tags, onSuccess }: Props = $props();
	let tags = $state.raw<NewTag[]>(_tags);
	let tagNames = $derived(tags.map((t) => t.name));

	let modal = $state<ReturnType<typeof Modal>>();
	let open = $state(false);
	export function show() {
		open = true;
		tags = _tags;
		tick().then(() => {
			if (input && !input.disabled) input.focus();
		});
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
	}

	let input = $state<HTMLInputElement>();
	let autocomplete = $state.raw<Tag[]>([]);
	let filter = $state('');
	let displayAutoComplete = $derived(!!filter);

	$effect(() => {
		if (displayAutoComplete) void getAlltags().then((t) => (autocomplete = t ?? []));
	});

	function handleSelectTag(tag: Tag) {
		tags = tags.concat(tag);
		filter = '';
	}

	function handleKeydown(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		if ((e.code === 'Space' || e.code === 'Enter') && input?.value.trim()) {
			e.preventDefault();
			if (!tagNames.includes(input.value.trim())) tags = tags.concat({ name: input.value.trim() });
			filter = '';
			return;
		}
	}
</script>

{#if open}
	<Modal bind:this={modal} onclose={() => (open = false)}>
		<form onsubmit={handleSubmit}>
			<h1><TagIcon size="16" /> Edit topics</h1>
			<div class="form-group" role="presentation" onclick={() => input?.focus()}>
				<span>Topics<span>(separate with spaces)</span></span>
				<div class="topics">
					{#each tags as tag, i}
						<span class="topic" onclick={(e) => e.stopPropagation()} role="presentation">
							<i>#</i>
							{tag.name}
							<button type="button" onclick={() => remove(i)}><X size="12" /></button>
						</span>
					{/each}
					<input
						type="text"
						disabled={tags.length === 5}
						bind:this={input}
						bind:value={filter}
						onkeydown={handleKeydown}
					/>
					{#if displayAutoComplete}
						<div
							class="autocomplete"
							style:top="{input.offsetTop + input.offsetHeight + 5}px"
							style:left="{input.parentElement!.offsetLeft}px"
							style:width="{input.parentElement!.offsetWidth}px"
						>
							<ul>
								{#each autocomplete as tag (tag.name)}
									{#if !tagNames.includes(tag.name) && tag.name
											.toLowerCase()
											.includes(filter.toLowerCase())}
										<li>
											<button type="button" onclick={() => handleSelectTag(tag)}>
												{tag.name}
											</button>
										</li>
									{/if}
								{/each}
							</ul>
						</div>
					{/if}
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
	.autocomplete {
		position: absolute;
		max-height: 65px;
		overflow-y: auto;
		background-color: hsl(0, 0%, 7%);
		border: 1px solid hsl(0deg 0% 20%);
		border-radius: 5px;

		& > ul {
			list-style: none;
			margin: 0;
			padding: 0;

			& > li {
				li ~ & {
					border-top: 1px solid hsl(0deg 0% 20%);
				}

				& > button {
					padding: 8px 16px;
					width: 100%;
					text-align: start;
					font-weight: 500;

					&:hover {
						background-color: hsl(0, 0%, 10%);
					}
				}
			}
		}
	}

	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: #dbdbdb;
	}

	h1 {
		margin: 0 0 12px;
		font-size: 18px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.form-group {
		display: block;

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
		padding: 5px 12px;
		border-radius: 5px;
		border: 1px solid hsl(0deg 0% 20%);
	}

	.topics span.topic {
		background: transparent;
		padding: 8px 16px;
		padding-right: 8px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		border: 1px solid hsl(0, 0%, 20%);
		font-weight: 400;
		transition: all 0.2s ease;
		font-size: 12px;
		display: flex;
		align-items: center;

		& > button {
			margin-left: 6px;
			height: 100%;
			aspect-ratio: 1;
			display: flex;
			align-items: center;
		}

		&:hover {
			background-color: transparent;
			color: hsl(0, 0%, 90%);
			border-color: hsl(0, 0%, 30%);
		}

		& i {
			font-variant: normal;
			color: hsl(0, 0%, 33%);
		}
	}

	input {
		width: 250px;
		background-color: hsl(0deg 0% 3%);
		border: 1px solid transparent;
		border-radius: 5px;
		outline: none;

		height: 30px;

		&:not(:disabled):is(:focus-within, :hover) {
			border-color: hsl(0deg 0% 34%);
		}

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
