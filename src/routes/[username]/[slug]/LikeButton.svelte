<script lang="ts">
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import type { Like } from '$lib/server/repositories/likes';
	import { easeCubicIn } from 'd3';
	import { fly } from 'svelte/transition';

	interface Props {
		likes?: number;
		disabled?: boolean;
		userLike?: Like | null;
		onLike?: (count: number) => unknown;
		max?: number;
	}

	let { likes = 0, onLike, userLike, disabled, max = 10 }: Props = $props();

	const liked = $derived(Boolean(userLike?.count));
	let counter = $state(userLike?.count ?? 0);

	let pressed = $state(false);
	let interval: ReturnType<typeof setInterval>;

	const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms));

	async function onPress() {
		pressed = true;
		if (counter === max) return;
		await wait(200);
		interval = setInterval(() => {
			if (pressed) counter = Math.min(counter + 1, max);
		}, 150);
	}

	function onRelease() {
		pressed = false;
		clearInterval(interval);

		const count = userLike?.count ?? 0;
		if (count === max || counter === 0 || count === counter) return;
		onLike?.(counter);
	}
</script>

<button
	onmousedown={onPress}
	onmouseup={onRelease}
	ontouchstart={onPress}
	ontouchend={onRelease}
	class="like"
	class:full={liked}
	{disabled}
>
	{#if pressed}
		<span class="user-counter" transition:fly={{ y: 10, easing: easeCubicIn, duration: 150 }}>
			+{counter}
		</span>
	{/if}
	<Heart size="16" fill={liked ? 'currentColor' : 'none'} />
	<span class="total-likes">{likes}</span>
</button>

<style>
	button.like {
		padding: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
		height: 34px;
		min-width: 34px;
		border: 1px solid hsl(0, 0%, 15%);
		border-radius: 4px;
		color: hsl(0, 0%, 80%);
		font-weight: 500;

		position: relative;

		&:is(:hover):not(:disabled) {
			background-color: hsl(0, 0%, 12%);
			color: hsl(0, 0%, 90%);
		}

		&:is(:active):not(:disabled) {
			background-color: hsl(0, 0%, 15%);
		}

		&:is(:disabled) {
			color: hsl(0, 0%, 64%);
			border-color: transparent;
		}

		&.full > :global(svg) {
			color: hsl(0deg 61% 54%);
		}
	}

	.user-counter {
		position: absolute;
		left: 50%;
		bottom: 100%;
		transform: translate(-50%, -5px);
	}

	button {
		appearance: none;
		outline: none;
		border: none;
		background-color: transparent;
		color: currentColor;
		padding: 0;

		&:is(:hover, :focus-within):not(:disabled) {
			cursor: pointer;
		}
	}
</style>
