<script lang="ts" generics="T">
	import { useResizeObserver } from '$lib/states/useResizeObserver.svelte';
	import { computePosition, flip, offset, shift, size } from '@floating-ui/dom';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		items: T[];
		anchor?: HTMLElement | null;
		item?: Snippet<[T]>;
		empty?: Snippet;
		onClose?: () => void;
		flip?: boolean;
	}

	let { items, anchor, item, empty, onClose, flip: activeFlip = true }: Props = $props();

	let opened = $state(false);
	let dropdown = $state<HTMLElement>();

	export function close() {
		opened = false;
		onClose?.();
	}

	export function open(target?: HTMLElement | null) {
		if (target) anchor = target;
		opened = true;
	}

	$effect(() => void updatePosition());

	async function updatePosition() {
		if (opened && anchor && dropdown) {
			const { x, y } = await computePosition(anchor, dropdown, {
				placement: 'bottom',
				middleware: [
					size({
						apply({ elements, rects }) {
							Object.assign(elements.floating.style, { minWidth: `${rects.reference.width}px` });
						}
					}),
					offset(5),
					activeFlip ? flip() : null,
					shift({ padding: 5 })
				]
			});
			Object.assign(dropdown.style, { left: `${x}px`, top: `${y}px` });
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (!(e.target instanceof Element) || !anchor || !dropdown) return;
		if (anchor.contains(e.target) || dropdown.contains(e.target)) return;

		close();
	}

	useResizeObserver(() => anchor, updatePosition);
</script>

<svelte:window onresize={updatePosition} onscroll={updatePosition} onclick={handleClickOutside} />

{#if opened}
	<div role="dialog" bind:this={dropdown} transition:fly={{ duration: 150, y: -10 }}>
		<ul role="menu">
			{#each items as i}
				<li role="menuitem">
					{@render item?.(i)}
				</li>
			{:else}
				<li>
					{@render empty?.()}
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	div[role='dialog'] {
		position: absolute;
		border-radius: 6px;
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;

		max-height: 130px;
		border: 1px solid hsl(0, 0%, 20%);
		border-radius: 6px;
		overflow-y: auto;
	}
</style>
