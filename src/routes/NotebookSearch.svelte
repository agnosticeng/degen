<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Autocomplete from '$lib/cmpnt/Autocomplete.svelte';
	import SearchBar from '$lib/cmpnt/SearchBar.svelte';
	import type { Tag } from '$lib/server/repositories/tags';

	interface Props {
		tags: Tag[];
	}

	let { tags }: Props = $props();

	let autocomplete = $state<ReturnType<typeof Autocomplete>>();
	let form = $state<HTMLFormElement>();
	let search = $state(page.url.searchParams.get('q') ?? '');
	$effect(() => {
		search = page.url.searchParams.get('q') ?? '';
	});
	let trends = $derived(tags.filter((t) => !search.includes(`#${t.name}`)));

	const searchURL = $derived.by(() => {
		if (['/', '[username]'].includes(page.route.id ?? '')) {
			return page.url;
		}

		const url = new URL(page.url);
		url.pathname = '/';
		url.search = '';
		return url;
	});

	async function handleSearch(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const q = formData.get('q');

		if (typeof q !== 'string') return;

		const url = new URL(searchURL);
		if (q.length) url.searchParams.set('q', q);
		else url.searchParams.delete('q');

		await goto(url, { state: { searchBar: true } });
	}
</script>

<form onsubmit={handleSearch} bind:this={form}>
	<SearchBar
		name="q"
		bind:value={search}
		onfocus={(e) =>
			e.currentTarget?.parentElement && autocomplete?.open(e.currentTarget.parentElement)}
	/>
	<Autocomplete bind:this={autocomplete} items={trends}>
		{#snippet item(trend)}
			<button
				type="button"
				onclick={() => {
					search = search.trim().concat(' ', `#${trend.name}`).trim();
					autocomplete?.close();
					goto(`${searchURL.pathname}?${new URLSearchParams({ q: search }).toString()}`, {
						state: { searchBar: true }
					});
				}}
			>
				<i>#</i>{trend.name}
			</button>
		{/snippet}
	</Autocomplete>
</form>

<style>
	form {
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
	}

	button {
		font-weight: 500;
		border: none;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		background: hsl(0, 0%, 5%);
		transition: all 0.2s ease;
		text-align: start;
		width: 100%;

		&:not(:disabled):hover {
			cursor: pointer;
			background: hsl(0, 0%, 8%);
			color: hsl(0, 0%, 90%);
		}

		& > i {
			font-variant: normal;
			color: hsl(0, 0%, 33%);
			transition: color 0.2s ease;
		}

		&:hover > i {
			color: hsl(0, 0%, 43%);
		}
	}
</style>
