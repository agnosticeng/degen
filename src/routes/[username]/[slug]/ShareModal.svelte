<script lang="ts">
	import { page } from '$app/state';
	import { update } from '$lib/client/requests/notebooks';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import Globe from '$lib/cmpnt/svg/globe.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { User } from '$lib/server/repositories/users';

	interface Props {
		notebook: Notebook & { author: User };
		onSuccess?: (notebook: Notebook) => void;
		disabled?: boolean;
	}

	let { notebook, onSuccess, disabled = false }: Props = $props();
	let open = $state(false);
	let modal = $state<ReturnType<typeof Modal>>();
	let error = $state('');

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		error = '';

		const formData = new FormData(e.currentTarget);
		const visibility = formData.get('visibility');
		const slug = formData.get('slug');

		if (
			typeof slug === 'string' &&
			typeof visibility === 'string' &&
			['private', 'public', 'unlisted'].includes(visibility)
		) {
			const updated = await update(notebook.id, {
				visibility: visibility as Notebook['visibility'],
				title: notebook.title,
				slug
			}).catch((e) => {
				if (e instanceof Error) {
					error = e.message;
				}
			});

			if (!updated) return;

			onSuccess?.(updated);
			modal?.close();
		}
	}

	export function show() {
		open = true;
	}

	function handleKeypress(e: KeyboardEvent) {
		if (!/[a-z0-9-]/.test(e.key)) e.preventDefault();
	}
</script>

{#if open}
	<Modal bind:this={modal} onclose={() => (open = false)} --modal-max-width="560px">
		<form onsubmit={handleSubmit}>
			<h1><Globe size="24" /><span>Share</span></h1>

			<h2>Notebook URL</h2>
			<div class="link-group">
				<span>{page.url.origin}/{notebook.author.username}/</span>
				<input
					name="slug"
					value={notebook.slug}
					readonly={disabled}
					required
					min="3"
					onkeypress={handleKeypress}
				/>
				<button
					type="button"
					class="bordered"
					onclick={() => navigator.clipboard.writeText(page.url.toString())}
				>
					Copy
				</button>
			</div>
			{#if error}
				<div class="errors">{error}</div>
			{/if}
			{#if !disabled}
				<h2>Access</h2>
				<label class="access">
					<span>Visibility</span>
					<select name="visibility" value={notebook.visibility} required {disabled}>
						<option value="public">Public</option>
						<option value="unlisted">Unlisted</option>
						<option value="private">Private</option>
					</select>
				</label>
				<div class="actions">
					<button type="button" onclick={() => modal?.close()}>Cancel</button>
					<button type="submit" {disabled}>Save</button>
				</div>
			{:else}
				<div class="actions">
					<button type="button" onclick={() => modal?.close()}>Close</button>
				</div>
			{/if}
		</form>
	</Modal>
{/if}

<style>
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
		gap: 10px;
	}

	h2 {
		font-size: 16px;
		font-weight: 400;
	}

	div.link-group {
		display: flex;
		align-items: center;

		input {
			outline: 0px;
			padding: 8px;
			padding-right: 24px;
			margin-left: 4px;
			background-color: transparent;
			border-radius: 5px;
			border: 1px solid hsl(0, 0%, 15%);
			color: inherit;
			width: 100%;

			&:is(:focus-visible, :focus, :focus-within) {
				border-color: hsl(0, 0%, 20%);
			}

			&:read-only {
				margin-left: 0;
				padding: 0;
				border-color: transparent;
			}
		}

		button {
			margin-left: 8px;
		}
	}

	label {
		display: flex;
		justify-content: space-between;
		align-items: center;

		select {
			appearance: none;
			outline: 0px;
			padding: 8px;
			padding-right: 24px;
			background-position: right 8px center;
			background-repeat: no-repeat;
			background-image: url($lib/cmpnt/svg/select-arrow-down.svg);
			background-color: transparent;
			border-radius: 5px;
			border: 1px solid hsl(0, 0%, 15%);
			color: inherit;

			&:disabled {
				background-image: none;
			}
		}
	}

	div.errors {
		margin-top: 8px;
		display: flex;
		justify-content: center;
		font-size: 12px;

		color: hsl(0deg 100% 90%);
	}

	form div.actions {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 8px;
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

		&.bordered {
			border: 1px solid hsl(0, 0%, 15%);
		}
	}
</style>
