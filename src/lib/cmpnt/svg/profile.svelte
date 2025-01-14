<script>
	let { handle = '', size = 44, gridSize = 8 } = $props();

	const pixels = $derived(() => {
		let colors = new Array(gridSize * gridSize);
		let hash = 0;
		const str = handle;
		const goldenRatio = 1.61803398875;

		for (let j = 0; j < str.length; j++) {
			hash = str.charCodeAt(j) + ((hash << 5) - hash);
		}
		let hue = Math.abs(hash) % 360;

		for (let i = 0; i < gridSize * gridSize; i++) {
			colors[i] = `hsl(${hue}, 70%, 50%)`;
			hue = (hue * goldenRatio) % 360;
		}

		return colors;
	});
</script>

<div class="avatar" style="width: {size}px; height: {size}px;">
	<svg width={size} height={size} viewBox="0 0 1 1">
		{#each pixels() as color, i}
			<rect
				x={(i % gridSize) / gridSize}
				y={Math.floor(i / gridSize) / gridSize}
				width={1 / gridSize}
				height={1 / gridSize}
				fill={color}
			/>
		{/each}
	</svg>
</div>

<style>
	.avatar {
		border-radius: 50%;
		overflow: hidden;
	}
</style>
