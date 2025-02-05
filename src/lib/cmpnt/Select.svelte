<script lang="ts">
	import { portal } from '$lib/actions/portal.svelte';
	import { computePosition, flip, offset, shift, type Placement } from '@floating-ui/dom';
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		anchor?: HTMLElement;
		placement?: Placement;
		children?: Snippet;
	}

	let { anchor, placement = 'bottom-start', children }: Props = $props();

	let opened = $state(false);
	let dropdown = $state<HTMLElement>();

	$effect(() => {
		if (opened && anchor && dropdown) {
			computePosition(anchor, dropdown, {
				placement,
				middleware: [offset(5), flip(), shift({ padding: 5 })]
			}).then(({ x, y }) => {
				if (dropdown) Object.assign(dropdown.style, { left: `${x}px`, top: `${y}px` });
			});
		}
	});

	export function close() {
		opened = false;
	}

	export function open(target?: HTMLElement) {
		if (target) anchor = target;
		opened = true;
	}

	async function handleResize() {
		if (opened && anchor && dropdown) {
			const { x, y } = await computePosition(anchor, dropdown, {
				placement,
				middleware: [offset(5), flip(), shift({ padding: 5 })]
			});
			Object.assign(dropdown.style, { left: `${x}px`, top: `${y}px` });
		}
	}
</script>

<svelte:window onresize={handleResize} />

{#if opened}
	<div
		use:portal
		class="backdrop"
		transition:fade={{ duration: 150 }}
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && close()}
	>
		<div role="dialog" bind:this={dropdown} transition:fly={{ duration: 150, y: -10 }}>
			{@render children?.()}
		</div>
	</div>
{/if}

<style>
	div.backdrop {
		position: fixed;
		inset: 0;
		background-color: transparent;
		z-index: 9999;
	}

	div[role='dialog'] {
		position: absolute;
		border-radius: 6px;
		overflow-y: auto;
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
	}
</style>
