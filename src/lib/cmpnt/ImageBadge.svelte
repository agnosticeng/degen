<script lang="ts">
	interface Props {
		size?: number;
		src: string;
		alt: string;
	}

	let { size = 30, src, alt }: Props = $props();
</script>

<div class="avatar" style:width="{size}px" style:height="{size}px">
	<img {alt} {src} loading="lazy" />
</div>

<style>
	div {
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		outline: none;
	}

	img {
		object-fit: cover;
		width: 100%;
		height: 100%;
	}
</style>
