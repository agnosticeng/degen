<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props {
		name: string;
		selected?: boolean;
		onclick?: SvelteHTMLElements['button']['onclick'];
		disabled?: SvelteHTMLElements['button']['disabled'];
	}

	let { name, selected, onclick, disabled }: Props = $props();
</script>

<button aria-current={selected} {onclick} {disabled}>
	<i>#</i>{name}
</button>

<style>
	button {
		background-color: hsl(0, 0%, 10%);
		padding: 4px;
		border-radius: 4px;
		font-weight: 400;
		transition: all 0.2s ease;
		font-size: 12px;
		line-height: 16px;

		& > i {
			font-variant: normal;
			color: hsl(0, 0%, 33%);
			transition: color 0.2s ease;
		}

		&:not(:disabled):hover,
		&[aria-current='true'] {
			background-color: hsl(0, 0%, 20%);
			color: hsl(0, 0%, 90%);

			& > i {
				color: hsl(0, 0%, 43%);
			}
		}
	}
</style>
