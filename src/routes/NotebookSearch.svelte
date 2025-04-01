<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Autocomplete from '$lib/cmpnt/Autocomplete.svelte';
	import SearchBar from '$lib/cmpnt/SearchBar.svelte';
	import type { Tag } from '$lib/server/repositories/tags';
	import { parse } from './search.utils';

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
	let trends = $derived.by(() => {
		const filter = parse(
			search,
			tags.map((t) => t.name)
		);

		const filtered = tags.filter((t) => !filter.tags.includes(t.name));

		return filter.search ? [filter.search, ...filtered] : filtered;
	});

	const searchURL = $derived.by(() => {
		if (['/', '/[username]'].includes(page.route.id ?? '')) {
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

		await apply(searchURL, q);
		autocomplete?.close();
	}

	async function apply(url: URL, q: string) {
		const nextUrl = new URL(url);
		nextUrl.search = '';
		if (q.length) nextUrl.searchParams.set('q', search);
		await goto(nextUrl, { state: { searchBar: true } });
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
			{#if typeof trend === 'string'}
				<button
					type="button"
					onclick={async () => {
						autocomplete?.close();
						await apply(searchURL, search);
					}}
				>
					Search: {trend}
				</button>
			{:else}
				<button
					type="button"
					onclick={async () => {
						search = search.trim().concat(' ', `#${trend.name}`).trim();
						autocomplete?.close();
						await apply(searchURL, search);
					}}
				>
					<i>#</i>{trend.name}
				</button>
			{/if}
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
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;

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
