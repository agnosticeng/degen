<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height'> {
		size?: string | number | null;
	}

	let { size = 24, ...rest }: Props = $props();
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	fill="currentColor"
	{...rest}
	data-name="branch-fork"
>
	<path
		d="M11 5.5a3.5 3.5 0 0 1-3 3.465V11.5h6.25a2.25 2.25 0 0 0 2.25-2.25v-.395A3.502 3.502 0 0 1 17.5 2a3.5 3.5 0 0 1 .5 6.965v.285A3.75 3.75 0 0 1 14.25 13H8v2.035a3.5 3.5 0 1 1-1.5.11v-6.29A3.502 3.502 0 0 1 7.5 2 3.5 3.5 0 0 1 11 5.5Zm-3.5 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-8 11a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"
	/>
</svg>
