<script lang="ts">
	import { enhance } from '$app/forms';
	import EyeSlash from '$lib/cmpnt/svg/eye-slash.svelte';
	import Eye from '$lib/cmpnt/svg/eye.svelte';
	import FloppyDiskBack from '$lib/cmpnt/svg/floppy-disk-back.svelte';
	import Lock from '$lib/cmpnt/svg/lock.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import type { Secret } from '$lib/server/repositories/secrets';
	import type { PageProps, SubmitFunction } from './$types';

	let { data }: PageProps = $props();

	let secrets = $state.raw(data.secrets);
	let showing = $state<Secret['id']>();
	const placeholder = Array(15).fill('*').join('');

	const handleCreate = (() =>
		({ result, formElement }) => {
			if (result.type === 'success' && result.data?.secret) {
				secrets = secrets.concat(result.data.secret);
				formElement.reset();
			}
		}) satisfies SubmitFunction;

	const handleDelete = (() =>
		({ result, formData }) => {
			if (result.type === 'success') {
				const secret_id = formData.get('secret_id') ?? '';
				if (typeof secret_id !== 'string') return;
				const id = parseInt(secret_id, 10);
				if (isNaN(id)) return;

				secrets = secrets.filter((s) => s.id !== id);
			}
		}) satisfies SubmitFunction;

	function handleKeypress(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		const value = e.currentTarget.value + e.key;
		if (!/[a-zA-z][a-zA-z0-9-_]*/.test(value)) e.preventDefault();
	}
</script>

<svelte:head>
	<title>Degen • Secrets</title>
</svelte:head>

<section>
	<div>
		<h2><Lock size="20" />Secrets</h2>
		<p>Define the secret variables for your queries</p>
	</div>
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Value</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each secrets as secret (secret.id)}
				<tr>
					<td><span>{secret.name}</span></td>
					<td>
						{#if showing === secret.id}
							<span>{secret.value}</span>
						{:else}
							<span>{placeholder}</span>
						{/if}
					</td>
					<td class="actions">
						{#if showing === secret.id}
							<button onclick={() => (showing = undefined)} class="icon-button" aria-current="true">
								<EyeSlash size="14" />
							</button>
						{:else}
							<button onclick={() => (showing = secret.id)} class="icon-button">
								<Eye size="14" />
							</button>
						{/if}
						<form action="?/delete" method="POST" use:enhance={handleDelete}>
							<input type="hidden" name="secret_id" value={secret.id} />
							<button class="icon-button danger">
								<Trash size="14" />
							</button>
						</form>
					</td>
				</tr>
			{/each}
			<tr>
				<td>
					<input
						type="text"
						name="secret_name"
						required
						placeholder="e.g. CLIENT_KEY"
						form="new-secret"
						onkeypress={handleKeypress}
					/>
				</td>
				<td>
					<input type="text" name="secret_value" required form="new-secret" />
				</td>
				<td class="actions">
					<form method="POST" action="?/create" id="new-secret" use:enhance={handleCreate}>
						<button class="icon-button"><FloppyDiskBack size="14" /></button>
					</form>
				</td>
			</tr>
		</tbody>
	</table>
</section>

<style>
	section {
		max-width: 1024px;
		margin: 0 auto;
		padding: 32px 20px 20px;
	}

	section h2 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		margin-bottom: 8px;

		display: flex;
		align-items: center;
		gap: 10px;
	}

	section > div {
		margin-bottom: 16px;
	}

	p {
		margin: 0;
		color: hsl(0, 0%, 76%);
	}

	table {
		width: 100%;
		border: 1px solid hsl(0, 0%, 20%);
		border-radius: 4px;
		display: grid;
		grid-template-columns: 1fr 1fr min-content;

		& :where(thead, tbody, tr) {
			display: contents;
		}

		& :where(th, td) {
			border-bottom: 1px solid hsl(0, 0%, 20%);
			padding: 6px 8px;

			&:first-child {
				padding-left: 16px;
			}

			&:last-child {
				padding-right: 16px;
			}
		}

		& tr:last-child td {
			border: none;
		}
	}

	table th {
		text-align: start;
		color: hsl(0, 0%, 76%);
		font-weight: 500;
		font-size: 12px;
		line-height: normal;
	}

	table td {
		height: 48px;
		display: flex;
		align-items: center;
		min-width: 0;

		& > span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		&.actions {
			justify-content: end;
			gap: 8px;
		}
	}

	form {
		display: contents;
	}

	button {
		font-weight: 500;
		border: none;
		cursor: pointer;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;

		&.icon-button {
			padding: 6px;
		}

		&:is(:hover, :focus, [aria-current='true']):not(:disabled) {
			background-color: hsl(0, 0%, 15%);
			color: hsl(0, 0%, 90%);

			&.danger {
				color: hsl(0deg 61% 54%);
				background-color: hsl(0, 34%, 12%);
			}
		}
	}

	input {
		outline: 0px;
		padding: 8px;
		background-color: transparent;
		border-radius: 5px;
		border: 1px solid hsl(0, 0%, 15%);
		color: inherit;
		width: 100%;

		&:is(:focus-visible, :focus, :focus-within) {
			border-color: hsl(0, 0%, 20%);
		}
	}
</style>
