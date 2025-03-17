<script lang="ts">
	import type { User } from '$lib/server/repositories/users';
	import ImageBadge from './ImageBadge.svelte';
	import Profile from './svg/profile.svelte';

	interface Props {
		user: User;
		size?: number;
	}

	let { user, size = 44 }: Props = $props();

	const src = $derived(user.pictureURL?.concat('?v=', user.updatedAt.getTime().toString()));
</script>

{#if src}
	<ImageBadge {src} alt={user.username} {size} />
{:else}
	<Profile {size} handle={user.username} />
{/if}
