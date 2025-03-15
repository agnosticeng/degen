<script lang="ts">
	interface Props {
		size?: number;
		src: string;
		alt: string;
		square?: boolean;
	}

	let { size = 30, src, alt, square = false }: Props = $props();
</script>

<div class:square style:width="{size}px" style:height="{size}px">
	<img {alt} {src} />
</div>

<style>
	div {
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		outline: none;

		&.square {
			border-radius: 5px;
		}
	}

	img {
		object-fit: cover;
		width: 100%;
		height: 100%;
	}
</style>
