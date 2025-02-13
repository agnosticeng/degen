<script lang="ts">
	import { update } from '$lib/client/requests/notebooks';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';

	interface Props {
		notebook: Notebook;
		onSuccess?: (notebook: Notebook) => void;
	}

	let { notebook, onSuccess }: Props = $props();
	let modal = $state<ReturnType<typeof Modal>>();

	let open = $state(false);
	export function show() {
		open = true;
	}

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const title = formData.get('title');

		if (typeof title === 'string') {
			if (title === notebook.title) return modal?.close();

			const updated = await update(notebook.id, { visibility: notebook.visibility, title });
			if (!updated) return;

			onSuccess?.(updated);
			modal?.close();
		}
	}
</script>

{#if open}
	<Modal bind:this={modal} onclose={() => (open = false)}>
		<form onsubmit={handleSubmit}>
			<h1>New notebook</h1>
			<label>
				<span>Title</span>
				<input
					type="text"
					placeholder="Bitcoin Analysis"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					name="title"
					value={notebook.title}
					required
				/>
			</label>
			<div class="actions">
				<button class="cancel" type="button" onclick={() => modal?.close()}> Cancel </button>
				<button type="submit">Save</button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: hsl(0, 0%, 86%);
	}

	h1 {
		font-size: 16px;
		margin: 0;
		margin-bottom: 12px;
	}

	label {
		display: block;

		&:not(:last-child) {
			margin-bottom: 12px;
		}

		& > span {
			font-size: 12px;
			display: block;
			margin-bottom: 8px;
		}
	}

	input[type='text'] {
		width: 100%;
		color: inherit;
		caret-color: currentColor;
		background-color: hsl(0deg 0% 3%);
		border: 1px solid hsl(0deg 0% 3%);
		border-radius: 5px;
		padding: 5px 10px;

		outline: none;
		caret-color: currentcolor;

		&:not(:read-only):is(:focus-within, :hover) {
			border-color: hsl(0deg 0% 34%);
		}
	}

	div.actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		height: 28px;
		margin-top: 12px;
	}

	button {
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
