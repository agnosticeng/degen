<script lang="ts">
	let { size = 20, color = 'currentColor', width = 2 } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	fill="none"
	viewBox="0 0 24 24"
	stroke-width={width}
	stroke={color}
>
	<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
	/>
</svg>
