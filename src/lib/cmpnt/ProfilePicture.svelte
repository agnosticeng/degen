<script lang="ts" module>
	import { PUBLIC_CDN } from '$env/static/public';

	export function getPictureProfileURL(user: User) {
		return [
			(PUBLIC_CDN ?? '').replace(/\/$/, ''),
			'/',
			user.username,
			'.jpg',
			'?v=',
			user.updatedAt.getTime()
		].join('');
	}
</script>

<script lang="ts">
	import type { User } from '$lib/server/repositories/users';
	import ImageBadge from './ImageBadge.svelte';
	import Profile from './svg/profile.svelte';

	interface Props {
		user: User;
		size?: number;
	}

	let { user, size = 44 }: Props = $props();

	let fallback = $state(false);
</script>

{#if fallback}
	<Profile {size} handle={user.username} />
{:else}
	<ImageBadge
		src={getPictureProfileURL(user)}
		alt={user.username}
		{size}
		onerror={() => (fallback = true)}
	/>
{/if}
