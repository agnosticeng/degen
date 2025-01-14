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
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
	/>
</svg>
