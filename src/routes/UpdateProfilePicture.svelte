<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageBadge from '$lib/cmpnt/ImageBadge.svelte';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import Profile from '$lib/cmpnt/svg/profile.svelte';
	import UserCircle from '$lib/cmpnt/svg/user-circle.svelte';
	import { processProfilePicture } from '$lib/image.utils';
	import type { User } from '$lib/server/repositories/users';
	import type { ChangeEventHandler } from 'svelte/elements';
	import type { SubmitFunction } from './$types';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let open = $state(false);
	let modal = $state<ReturnType<typeof Modal>>();
	let pictureURL = $state(user.pictureURL);
	let fileToUpload = $state<File>();
	let error = $state('');

	export function show() {
		open = true;
		error = '';
		pictureURL = user.pictureURL;
		fileToUpload = undefined;
	}

	let input = $state<HTMLInputElement>();
	const handleFileChange = (async (e) => {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		try {
			[pictureURL, fileToUpload] = await processProfilePicture(file);
		} catch (err) {
			console.error(err);
			if (err instanceof Error) error = err.message;
			if (input) input.value = '';
			fileToUpload = undefined;
		}
	}) satisfies ChangeEventHandler<HTMLInputElement>;

	const handleSubmit = (({ formData, cancel }) => {
		if (fileToUpload) formData.set('picture', fileToUpload);
		else cancel();

		return ({ result }) => {
			if (result.type === 'success' && result.data?.user) {
				user = {
					...result.data.user,
					pictureURL: result.data.user.pictureURL
						? result.data.user.pictureURL + '?v' + Date.now()
						: null
				};
				modal?.close();
			}
		};
	}) satisfies SubmitFunction;
</script>

{#if open}
	<Modal onclose={() => (open = false)} bind:this={modal}>
		<form
			method="POST"
			action="/?/update_profile_picture"
			use:enhance={handleSubmit}
			enctype="multipart/form-data"
		>
			<h1><UserCircle size="16" /><span>Update profile picture</span></h1>
			<p>Your picture will be visible to everyone.</p>
			<div>
				{#if pictureURL}
					<ImageBadge alt="Profile picture" src={pictureURL} size={44} />
				{:else}
					<Profile handle={user.username} />
				{/if}
				<button type="button" onclick={() => input?.click()}>Upload new</button>
				<input
					type="file"
					name="picture"
					accept="image/*"
					required
					bind:this={input}
					onchange={handleFileChange}
				/>
			</div>
			{#if error}
				<p class="error">{error}</p>
			{/if}
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
		color: hsl(0, 0%, 86%);
	}

	h1 {
		margin: 0 0 12px;
		font-size: 18px;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	p {
		margin: 0;
		color: hsl(0, 0%, 76%);
	}

	div {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
		margin-top: 24px;
	}

	div.actions {
		justify-content: end;
		gap: 8px;
		margin-top: 12px;
	}

	.error {
		margin-top: 12px;

		display: flex;
		justify-content: center;
		font-size: 12px;
		color: hsl(0deg 100% 90%);
	}

	input[type='file'] {
		border: 0;
		clip: rect(0 0 0 0);
		height: 1px;
		margin: -1px;
		overflow: hidden;
		padding: 0;
		position: absolute;
		width: 1px;
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
	}
</style>
