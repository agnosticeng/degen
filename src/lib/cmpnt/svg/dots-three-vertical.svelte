<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height' | 'fill'> {
		size?: string | number | null;
	}

	let { size = 24, color = 'currentColor', ...rest }: Props = $props();
</script>

<svg width={size} height={size} fill={color} viewBox="0 0 256 256" {...rest}>
	<path
		d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM128,72a12,12,0,1,0-12-12A12,12,0,0,0,128,72Zm0,112a12,12,0,1,0,12,12A12,12,0,0,0,128,184Z"
	/>
</svg>
