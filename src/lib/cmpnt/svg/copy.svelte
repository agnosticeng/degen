<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height'> {
		size?: string | number | null;
	}

	let { size = 24, ...rest }: Props = $props();
</script>

<svg viewBox="0 0 256 256" width={size} height={size} {...rest} data-name="copy">
	<polyline
		points="168 168 216 168 216 40 88 40 88 88"
		fill="none"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="16"
	/>
	<rect
		x="40"
		y="88"
		width="128"
		height="128"
		fill="none"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="16"
	/>
</svg>
