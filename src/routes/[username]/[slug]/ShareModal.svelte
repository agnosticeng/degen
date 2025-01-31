<script lang="ts">
	import { page } from '$app/state';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import Globe from '$lib/cmpnt/svg/globe.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import { updateVisibility } from './requests';

	interface Props {
		notebook: Notebook;
		onSuccess?: (notebook: Notebook) => void;
	}

	let { notebook, onSuccess }: Props = $props();
	let open = $state(false);
	let modal = $state<ReturnType<typeof Modal>>();

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const visibility = formData.get('visibility');

		if (typeof visibility === 'string' && ['private', 'public', 'unlisted'].includes(visibility)) {
			const updated = await updateVisibility(notebook.id, visibility as Notebook['visibility']);
			if (!updated) return;

			onSuccess?.(updated);
			modal?.close();
		}
	}

	export function show() {
		open = true;
	}

	let input = $state<HTMLInputElement>();
</script>

{#if open}
	<Modal bind:this={modal} onclose={() => (open = false)} --modal-max-width="560px">
		<form onsubmit={handleSubmit}>
			<h2><Globe size="16" /><span>Share</span></h2>

			<h3>Notebook URL</h3>
			<div class="link-group">
				<input
					bind:this={input}
					name="url"
					readonly
					value="{page.url.origin}{page.url.pathname}"
					onclick={() => input?.select()}
				/>
				<button
					type="button"
					class="bordered"
					onclick={() => navigator.clipboard.writeText(input?.value ?? '')}
				>
					Copy
				</button>
			</div>
			<h3>Access</h3>
			<label class="access">
				<span>Visibility</span>
				<select name="visibility" value={notebook.visibility} required>
					<option value="public">Public</option>
					<option value="unlisted">Unlisted</option>
					<option value="private">Private</option>
				</select>
			</label>
			<div class="actions">
				<button type="button" onclick={() => modal?.close()}>Cancel</button>
				<button type="submit">Save</button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: #dbdbdb;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 18px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	h3 {
		font-size: 16px;
		font-weight: 400;
	}

	div.link-group {
		display: flex;
		align-items: center;
		gap: 8px;

		input {
			outline: 0px;
			padding: 8px;
			padding-right: 24px;
			background-color: transparent;
			border-radius: 4px;
			border: 1px solid hsl(0, 0%, 15%);
			color: inherit;
			width: 100%;
		}
	}

	label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;

		margin-bottom: 12px;

		select {
			appearance: none;
			outline: 0px;
			padding: 8px;
			padding-right: 24px;
			background-position: right 8px center;
			background-repeat: no-repeat;
			background-image: url($lib/cmpnt/svg/select-arrow-down.svg);
			background-color: transparent;
			border-radius: 4px;
			border: 1px solid hsl(0, 0%, 15%);
			color: inherit;
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

	form div.actions {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 8px;
	}

	button {
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
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

		&:hover {
			background-color: hsl(0, 0%, 15%);
			color: hsl(0, 0%, 90%);
		}

		&.bordered {
			border: 1px solid hsl(0, 0%, 15%);
		}
	}
</style>
