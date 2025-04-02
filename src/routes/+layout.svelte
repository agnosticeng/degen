<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { page } from '$app/state';
	import Modal from '$lib/cmpnt/Modal.svelte';
	import ProfilePicture from '$lib/cmpnt/ProfilePicture.svelte';
	import Select from '$lib/cmpnt/Select.svelte';
	import DocumentChartBar from '$lib/cmpnt/svg/document-chart-bar.svelte';
	import Lock from '$lib/cmpnt/svg/lock.svelte';
	import Logo from '$lib/cmpnt/svg/logo.svelte';
	import PlusCircle from '$lib/cmpnt/svg/plus-circle.svelte';
	import Search from '$lib/cmpnt/svg/search.svelte';
	import SignOut from '$lib/cmpnt/svg/sign-out.svelte';
	import UserCircle from '$lib/cmpnt/svg/user-circle.svelte';
	import X from '$lib/cmpnt/svg/x.svelte';
	import '$lib/styles/main.css';
	import type { ActionData, LayoutProps } from './$types';
	import NotebookSearch from './NotebookSearch.svelte';
	import UpdateAvatar from './UpdateAvatar.svelte';

	let { data, children }: LayoutProps = $props();

	let user = $state(data.user);
	let openNewNotebook = $state(false);
	let newNotebookModal = $state<ReturnType<typeof Modal>>();
	let errorMessage = $state<string>('');

	function login() {
		window.open(`/login?redirectTo=${page.url.pathname}`, '_self');
	}

	function logout() {
		window.open('/logout', '_self');
	}

	let searchBarVisible = $state(false);
	const pathname = $derived(page.url.pathname);
	const searchBarPageState = $derived(page.state.searchBar ?? false);
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		pathname; // effect dependency
		searchBarVisible = searchBarPageState;
	});

	let userSelect = $state<ReturnType<typeof Select>>();
	let updateAvatar = $state<ReturnType<typeof UpdateAvatar>>();
</script>

<header>
	<span>
		<a href="/" aria-label="Home"><Logo /></a>
	</span>
	{#if searchBarVisible}
		<NotebookSearch tags={data.trends} />
	{/if}
	<span style="justify-content: end;">
		{#if !searchBarVisible}
			{#if data.user}
				<button class="new" onclick={() => (openNewNotebook = true)} disabled={!data.user.username}>
					<PlusCircle size="16" />New
				</button>
			{/if}
			{#if !data.authenticated}
				<button class="sign-in" aria-label="Sign In" onclick={login}>Sign in</button>
			{/if}
		{/if}
		<button
			class="icon-button"
			aria-label={searchBarVisible ? 'Close search bar' : 'Show search bar'}
			onclick={() => (searchBarVisible = !searchBarVisible)}
		>
			{#if searchBarVisible}
				<X size="20" />
			{:else}
				<Search size="20" />
			{/if}
		</button>
		{#if user}
			<button
				class="icon-button"
				style="background-color: transparent;"
				onclick={(e) => userSelect?.open(e.currentTarget)}
			>
				<ProfilePicture {user} size={20} />
			</button>
			<Select placement="bottom-end" bind:this={userSelect}>
				<ul role="menu" class="user-select">
					<li>
						<button onclick={() => (updateAvatar?.show(), userSelect?.close())}>
							<UserCircle size="14" />Update avatar
						</button>
					</li>
					<li>
						<a href="/{data.user?.username}" onclick={() => userSelect?.close()}>
							<DocumentChartBar size="14" />My notebooks
						</a>
					</li>
					<li>
						<a href="/secrets" onclick={() => userSelect?.close()}>
							<Lock size="14" />Secrets
						</a>
					</li>
					<li><span class="separator"></span></li>
					<li>
						<button onclick={() => (logout(), userSelect?.close())}>
							<SignOut size="14" />Log out
						</button>
					</li>
				</ul>
			</Select>
			<UpdateAvatar bind:user bind:this={updateAvatar} />
		{/if}
	</span>
</header>
{#if data.authenticated && !data.user}
	<form
		class="create-user"
		method="POST"
		action="/?/create_user"
		use:enhance={() =>
			async ({ formElement, result }) => {
				if (result.type === 'failure') {
					const data = result.data as ActionData;
					errorMessage = data?.message ?? '';
					return;
				}
				formElement.reset();
				errorMessage = '';
				await applyAction(result);
			}}
	>
		<h1>Create your username!</h1>
		<h2>Your username will be public and cannot be changed.</h2>
		<label>
			<span>Username</span>
			<input
				type="text"
				placeholder="satoshinakamoto"
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				name="username"
				required
			/>
		</label>
		<div class="errors">{errorMessage}</div>
		<div class="actions">
			<button type="submit">Save</button>
		</div>
	</form>
{:else}
	{@render children()}
{/if}
{#if openNewNotebook}
	<Modal onclose={() => (openNewNotebook = false)} bind:this={newNotebookModal}>
		<form
			class="new-notebook"
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
			<h1><DocumentChartBar size="20" />New notebook</h1>
			<label>
				<span>Title</span>
				<input
					type="text"
					placeholder="Bitcoin Analysis"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					name="title"
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
	header {
		border-bottom: 1px solid hsl(0, 0%, 20%);
		padding: 0 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		height: 48px;
	}

	button {
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

	button.icon-button {
		background-color: transparent;
		padding: 6px;

		&:hover {
			background-color: hsl(0, 0%, 8%);
			color: hsl(0, 0%, 90%);
		}
	}

	header span {
		height: 24px;
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
	}

	header > :global(form) {
		flex: auto;
		max-width: 1024px;
		padding: 0 20px;
	}

	footer {
		max-width: 1024px;
		margin: auto;
		color: hsl(0, 0%, 60%);
		font-weight: 300;
		font-size: 12px;
		margin-top: 50px;
		padding: 0 20px;
		padding-bottom: 50px;
	}

	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: hsl(0, 0%, 86%);
	}

	form h1 {
		margin: 0 0 12px;
		font-size: 18px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	form label {
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

	form input[type='text'] {
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

	form button.cancel:not(:hover) {
		background: transparent;
	}

	form.create-user div.errors {
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

	form.create-user {
		background-color: inherit;
		max-width: 560px;
		margin: 0 auto;

		h2 {
			font-weight: 400;
			font-size: 12px;
			color: hsl(0, 0%, 65%);
			margin: 0;
			margin-bottom: 30px;
		}
	}

	ul[role='menu'] {
		list-style: none;
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;
		border: 1px solid hsl(0, 0%, 15%);
		border-radius: 6px;

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

			& > :where(button, a) {
				width: 100%;
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 16px;
				color: hsl(0, 0%, 80%);
				border-radius: 0;
				background-color: transparent;

				&:is(:hover, :focus-within):not(:disabled):not([aria-disabled='true']) {
					color: hsl(0, 0%, 90%);
					background-color: hsl(0, 0%, 15%);
				}
			}
		}
	}
</style>
