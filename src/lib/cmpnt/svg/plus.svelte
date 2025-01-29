<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height'> {
		size?: string | number | null;
	}

	let { size = 24, color = 'currentColor', ...rest }: Props = $props();
</script>

<svg width={size} height={size} fill={color} viewBox="0 0 256 256" {...rest}>
	<path
		d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"
	/>
</svg>
