<script lang="ts">
	import { fork } from '$lib/client/requests/notebooks';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import BranchFork from '$lib/cmpnt/svg/branch-fork.svelte';
	import Visibility from '$lib/cmpnt/Visibility.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';
	import type { User } from '$lib/server/repositories/users';

	interface Props {
		notebook: Notebook;
		onSuccess?: (notebook: Notebook & { author: User }) => void;
	}

	let { notebook, onSuccess }: Props = $props();
	let modal = $state<ReturnType<typeof Modal>>();
	let open = $state(false);

	export function show() {
		open = true;
	}

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		const form = new FormData(e.currentTarget);
		const visibility = form.get('visibility');
		if (!isVisibilityValue(visibility)) return;

		const updated = await fork(notebook.id);
		if (updated) onSuccess?.(updated);

		modal?.close();
	}

	function isVisibilityValue(value: unknown): value is Notebook['visibility'] {
		return typeof value === 'string' && ['private', 'public', 'unlisted'].includes(value);
	}
</script>

{#if open}
	<Modal onclose={() => (open = false)} bind:this={modal}>
		<form method="post" onsubmit={handleSubmit}>
			<h1><BranchFork size="24" />Fork this notebook</h1>

			<h2>Visibility</h2>
			<label>
				<input
					type="radio"
					name="visibility"
					value="public"
					checked={notebook.visibility === 'public'}
					required
				/>
				<Visibility visibility="public" />
			</label>
			<label>
				<input
					type="radio"
					name="visibility"
					value="unlisted"
					checked={notebook.visibility === 'unlisted'}
					required
				/>
				<Visibility visibility="unlisted" />
			</label>
			<label>
				<input
					type="radio"
					name="visibility"
					value="private"
					checked={notebook.visibility === 'private'}
					required
				/>
				<Visibility visibility="private" />
			</label>
			<div class="actions">
				<button class="cancel" type="button" onclick={() => modal?.close()}>Cancel</button>
				<button type="submit">Fork</button>
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
		font-size: 18px;
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		margin-bottom: 12px;
	}

	h2 {
		font-size: 16px;
		font-weight: 400;
	}

	label {
		margin: 0 16px;
		margin-bottom: 12px;
		display: flex;
		align-items: center;
		gap: 8px;

		&:first-of-type {
			margin-top: 16px;
		}

		&:last-of-type {
			margin-bottom: 16px;
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
