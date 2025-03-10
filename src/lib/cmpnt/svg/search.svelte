<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height'> {
		size?: string | number | null;
	}

	let { size = 24, ...rest }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	fill="none"
	viewBox="0 0 24 24"
	stroke-width="2"
	stroke="currentColor"
	{...rest}
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
	/>
</svg>
