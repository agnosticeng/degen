<script lang="ts">
	import * as Plot from '@observablehq/plot';
	import * as d3 from 'd3';

	let div: HTMLElement | undefined = $state();
	let data = $state(d3.ticks(-2, 2, 200).map(Math.sin));

	function onMousemove(event: MouseEvent) {
		const [x, y] = d3.pointer(event);
		data = data.slice(-200).concat(Math.atan2(x, y));
	}

	let width = $state(0);
	let height = $state(0);

	function handleResize() {
		if (!div) return;
		width = div.clientWidth;
		height = div.clientHeight;
	}

	$effect(() => {
		if (!div) return;

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	$effect(() => {
		if (!div || !width || !height) return;

		div.firstChild?.remove();
		div.append(Plot.lineY(data).plot({ grid: true, width, height }));
	});
</script>

<div onmousemove={onMousemove} bind:this={div} role="img"></div>

<style>
	div {
		width: 100%;
		height: 100%;
	}
</style>
