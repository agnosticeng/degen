<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<section>
	{@render children()}
</section>

<style>
	section {
		max-width: 1024px;
		margin: 0 auto;
		padding: 20px 24px;
	}
</style>
