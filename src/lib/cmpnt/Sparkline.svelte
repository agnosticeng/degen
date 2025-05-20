<script lang="ts">
	interface Props {
		data: number[];
		title?: string;
	}

	let { data, title }: Props = $props();
	const uid = $props.id();

	const points = $derived.by(() => {
		if (data.length < 2) {
			return '';
		} else {
			const max = Math.max(...data);
			const min = Math.min(...data);
			const range = max === min ? max || 1 : max - min;
			const width = 155;
			const height = 28;

			return data
				.map((value, index) =>
					[
						((index / (data.length - 1)) * width).toFixed(2),
						(height - ((value - min) / range) * height).toFixed(2)
					].join(',')
				)
				.join(' ');
		}
	});
</script>

<svg width="155" height="30" aria-hidden="true">
	{#if title}
		<title>{title}</title>
	{/if}
	<defs>
		<linearGradient id="gradient-{uid}" x1="0" x2="0" y1="1" y2="0">
			<stop offset="0%" stop-color="#1b4721"></stop>
			<stop offset="10%" stop-color="#2b6a30"></stop>
			<stop offset="25%" stop-color="#46954a"></stop>
			<stop offset="50%" stop-color="#6bc46d"></stop>
		</linearGradient>
		<mask id="sparkline-{uid}" x="0" y="0" width="155" height="28">
			<polyline {points} fill="transparent" stroke="#8cc665" stroke-width="2" />
		</mask>
	</defs>

	<g transform="translate(0, 2.0)">
		<rect
			x="0"
			y="-2"
			width="155"
			height="30"
			style="stroke: none; fill: url(#gradient-{uid}); mask: url(#sparkline-{uid})"
		></rect>
	</g>
</svg>
