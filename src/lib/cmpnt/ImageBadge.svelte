<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props {
		size?: number;
		src: string;
		alt: string;
		onerror?: SvelteHTMLElements['image']['onerror'];
	}

	let { size = 30, src, alt, onerror }: Props = $props();
</script>

<div class="avatar" style:width="{size}px" style:height="{size}px">
	<img {alt} {src} loading="lazy" {onerror} />
</div>

<style>
	div {
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		outline: none;
	}

	img {
		object-fit: cover;
		width: 100%;
		height: 100%;
	}
</style>
