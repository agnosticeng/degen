<script lang="ts">
	import Heart from '$lib/cmpnt/svg/heart.svelte';
	import type { Like } from '$lib/server/repositories/likes';
	import debounce from 'p-debounce';

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

	let onLikeDebounced = $derived.by(() => {
		if (onLike) return debounce(onLike, 200);
	});

	async function onPress() {
		if (counter === max) return;
		counter = Math.min(counter + 1, max);
		await onLikeDebounced?.(counter);
	}
</script>

<button
	onmousedown={onPress}
	ontouchstart={onPress}
	class="like"
	class:full={liked}
	disabled={disabled || counter === max}
>
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
</style>
