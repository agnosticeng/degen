<script lang="ts">
	import Globe from '$lib/cmpnt/svg/globe.svelte';
	import LinkSimple from '$lib/cmpnt/svg/link-simple.svelte';
	import Lock from '$lib/cmpnt/svg/lock.svelte';
	import type { Notebook } from '$lib/server/repositories/notebooks';

	interface Props {
		visibility: Notebook['visibility'];
	}

	let { visibility }: Props = $props();

	const isPublic = $derived(visibility === 'public');
	const iconSize = 16;

	const title = $derived.by(() => {
		if (visibility === 'public') return 'Anyone can see this notebook.';
		if (visibility === 'unlisted') return 'Only people with the link can see this notebook.';
		return 'Only you can see this notebook.';
	});
</script>

<div class:purple={!isPublic} {title}>
	{#if visibility === 'public'}
		<Globe size={iconSize} />
	{:else if visibility === 'private'}
		<Lock size={iconSize} />
	{:else if visibility === 'unlisted'}
		<LinkSimple size={iconSize} />
	{/if}

	{#if visibility === 'public'}
		Public
	{:else if visibility === 'private'}
		Only you
	{:else if visibility === 'unlisted'}
		Secret
	{/if}
</div>

<style>
	div {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px;
		background-color: hsl(156, 59%, 20%);
		color: hsl(152, 54%, 65%);
		border-radius: 4px;

		&.purple {
			color: hsl(268, 48%, 75%);
			background-color: hsl(265, 100%, 25%);
		}
	}
</style>
