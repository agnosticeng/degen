<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import Logo from '$lib/cmpnt/svg/logo.svelte';
	import PlusCircle from '$lib/cmpnt/svg/plus-circle.svelte';
	import Search from '$lib/cmpnt/svg/search.svelte';
	import type { ActionData } from './$types';

	let { children } = $props();

	let openNewNotebook = $state(false);
	let newNotebookModal = $state<ReturnType<typeof Modal>>();
	let errorMessage = $state<string>('');
</script>

<header>
	<a href="/"><Logo /></a>
	<span>
		<button class="new" onclick={() => (openNewNotebook = true)}>
			<PlusCircle size="16" /> New
		</button>
		<button class="sign-in">Sign in</button>
		<Search size={20} />
	</span>
</header>
{@render children()}

{#if openNewNotebook}
	<Modal onclose={() => (openNewNotebook = false)} bind:this={newNotebookModal}>
		<form
			method="POST"
			action="/?/create_notebook"
			use:enhance={() =>
				async ({ formElement, result }) => {
					if (result.type === 'failure') {
						const data = result.data as ActionData;
						errorMessage = data?.message ?? '';
						return;
					}
					formElement.reset();
					errorMessage = '';
					newNotebookModal?.close();
					await applyAction(result);
				}}
		>
			<label>
				<span>Name</span>
				<input
					type="text"
					placeholder="Bitcoin Analysis"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					name="name"
					required
				/>
			</label>
			<div class="errors">{errorMessage}</div>
			<div class="actions">
				<button class="cancel" type="button" onclick={() => newNotebookModal?.close()}>
					Cancel
				</button>
				<button type="submit">Create</button>
			</div>
		</form>
	</Modal>
{/if}

<footer>© 2025 Agnostic</footer>

<style>
	:global(html, body) {
		background: hsl(0, 0%, 5%);
		color: hsl(0, 0%, 86%);
		margin: 0;
	}

	:global(*) {
		box-sizing: border-box;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	header {
		border-bottom: 1px solid hsl(0, 0%, 20%);
		padding: 0 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
	}

	button {
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
	}

	button:hover {
		background: hsl(0, 0%, 15%);
		color: hsl(0, 0%, 90%);
	}

	.new {
		background: transparent;
	}

	header span {
		height: 24px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	footer {
		max-width: 1024px;
		margin: auto;
		color: hsl(0, 0%, 60%);
		font-weight: 300;
		font-size: 12px;
		margin-top: 50px;
		margin-bottom: 50px;
		padding: 0 20px;
	}

	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: hsl(0, 0%, 86%);
	}

	form label {
		display: block;

		&:not(:last-child) {
			margin-bottom: 12px;
		}

		& > span {
			display: block;
			margin-bottom: 8px;
		}
	}

	form input[type='text'] {
		width: 100%;
		color: inherit;
		caret-color: currentColor;
		background-color: hsl(0deg 0% 3%);
		border: 1px solid hsl(0deg 0% 3%);
		border-radius: 3px;
		padding: 5px 10px;

		outline: none;
		caret-color: currentcolor;

		&:not(:read-only):is(:focus-within, :hover) {
			border-color: hsl(0deg 0% 34%);
		}
	}

	form button.cancel:not(:hover) {
		background: transparent;
	}

	form div.errors {
		display: flex;
		justify-content: center;
		font-size: 12px;

		color: hsl(0deg 100% 90%);
	}

	form div.actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		height: 28px;
		margin-top: 12px;
	}
</style>
