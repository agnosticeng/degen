<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props extends Omit<SvelteHTMLElements['svg'], 'width' | 'height'> {
		size?: string | number | null;
	}

	let { size = 24, ...rest }: Props = $props();
</script>

<svg width={size} height={size} stroke="currentColor" viewBox="0 0 24 24" {...rest}>
	<g>
		<circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3" />
	</g>
</svg>

<style>
	g {
		transform-origin: center;
		animation: rotate 2s linear infinite;
	}

	g > circle {
		stroke-linecap: round;
		animation: bounce 1.5s ease-in-out infinite;
	}

	@keyframes rotate {
		100% {
			transform: rotate(360deg);
		}
	}

	@keyframes bounce {
		0% {
			stroke-dasharray: 0 150;
			stroke-dashoffset: 0;
		}
		47.5% {
			stroke-dasharray: 42 150;
			stroke-dashoffset: -16;
		}
		95%,
		100% {
			stroke-dasharray: 42 150;
			stroke-dashoffset: -59;
		}
	}
</style>
