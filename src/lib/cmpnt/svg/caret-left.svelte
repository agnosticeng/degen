<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height' | 'fill'> {
		size?: string | number | null;
	}

	let { size = 24, color = 'currentColor', ...rest }: Props = $props();
</script>

<svg width={size} height={size} fill={color} viewBox="0 0 256 256" {...rest}>
	<path
		d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"
	/>
</svg>
