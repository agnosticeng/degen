<script lang="ts">
	import type { PageProps } from './$types';
	import Block from './Block.svelte';

	let { data }: PageProps = $props();
	let blocks = $state(data.notebook.contents);
</script>

<section>
	{#each blocks as _block, i}
		<Block bind:value={blocks[i]} />
	{/each}
</section>

<style>
	section {
		max-width: 1024px;
		margin: 0 auto;
		padding: 20px 20px;
	}
</style>
