<script lang="ts">
	import Select from '$lib/cmpnt/Select.svelte';
	import Cog6Tooth from '$lib/cmpnt/svg/cog-6-tooth.svelte';
	import type { ColumnDescriptor } from '$lib/server/proxy';
	import type { ChartSettingsType } from '@agnosticeng/dv';

	interface Props {
		settings?: ChartSettingsType | { type: 'table' };
		columns: ColumnDescriptor[];
	}

	let { settings = $bindable({ type: 'table' }), columns }: Props = $props();

	let select = $state<ReturnType<typeof Select>>();
	let anchor = $state<HTMLButtonElement>();

	const candleColumns = ['open', 'close', 'low', 'high'];

	const handleChartTypeChange = (event: Event) => {
		const select = event.target as HTMLSelectElement;
		const type = select.value as 'candle' | 'line' | 'bar' | 'table' | 'h-bar';

		if (type === 'table') {
			settings = { type };
			return;
		}

		const dateColumn = columns.find((col) => col.type.toLowerCase().includes('date'))?.name;
		const otherColumns = columns
			.filter((col) => !col.type.toLowerCase().includes('date'))
			.map((col) => col.name);

		if (type === 'candle') {
			settings = {
				x: dateColumn ?? '',
				y: candleColumns,
				type
			};
		}

		settings = {
			x: dateColumn ?? '',
			y: otherColumns,
			z: undefined,
			...settings,
			type
		};
	};

	const handleXAxisChange = (event: Event) => {
		if (settings.type === 'table') return;
		const select = event.target as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);
		settings.x = options[select.selectedIndex];
	};

	const handleYAxisChange = (event: Event) => {
		if (settings.type === 'table') return;
		const select = event.target as HTMLSelectElement;
		const selectedOptions = Array.from(select.selectedOptions).map((option) => option.value);
		settings.y = selectedOptions;
	};

	const handleZAxisChange = (event: Event) => {
		if (settings.type === 'table') return;
		const select = event.target as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);
		settings.z = options[select.selectedIndex];
		if (!settings.z) settings.z = undefined;
	};

	const handleLegendChange = (event: Event) => {
		if (settings.type === 'table') return;
		const select = event.target as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);
		settings.legend = options[select.selectedIndex] as 'x' | 'y' | 'z';
		if (!settings.legend) settings.legend = undefined;
	};
</script>

<button class="chart-settings" bind:this={anchor} onclick={() => select?.open()}>
	<Cog6Tooth size="14" />
</button>

<Select bind:this={select} {anchor} placement="bottom-end">
	<form>
		<div class="setting">
			<span>type</span>
			<select value={settings.type} onchange={handleChartTypeChange} size={6}>
				<option value="table">table</option>
				<option value="line">line</option>
				<option value="candle">candle</option>
				<option value="bar">bar</option>
				<option value="h-bar">h-bar</option>
				<option value="bubble">bubble</option>
			</select>
		</div>
		{#if settings.type === 'candle' || settings.type === 'line' || settings.type === 'bar' || settings.type === 'h-bar' || settings.type === 'bubble'}
			<div class="setting">
				<span>x-axis</span>
				<select value={settings.x} onchange={handleXAxisChange} size={columns.length}>
					{#each columns as column}
						<option value={column.name}>{column.name}</option>
					{/each}
				</select>
			</div>

			<div class="setting">
				<span>y-axis</span>
				<div style="display: flex; gap: 5px;">
					<select
						multiple
						value={settings.y}
						onchange={handleYAxisChange}
						size={columns.length}
						disabled={settings.type === 'candle'}
					>
						{#each columns as column}
							<option value={column.name}>{column.name}</option>
						{/each}
					</select>
				</div>
			</div>

			{#if settings.type !== 'candle'}
				<div class="setting">
					<span>z-axis</span>
					<div style="display: flex; gap: 5px;">
						<select value={settings.z} onchange={handleZAxisChange} size={columns.length + 1}>
							<option value="">none</option>
							{#each columns as column}
								<option value={column.name}>{column.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="setting">
					<span>legend</span>
					<div style="display: flex; gap: 5px;">
						<select value={settings.legend} onchange={handleLegendChange} size={4}>
							<option value="">none</option>
							<option value="x">x</option>
							<option value="y">y</option>
							<option value="z">z</option>
						</select>
					</div>
				</div>
			{/if}
		{/if}
	</form>
</Select>

<style>
	button {
		height: 100%;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: hsl(0, 0%, 80%);

		&:is(:hover, :focus-within):not(:disabled) {
			color: hsl(0, 0%, 90%);
		}
	}

	form {
		font-family: monospace;
		font-size: 10px;
		width: 200px;
		background: hsla(0, 0%, 5%, 0.8);
		border: 1px solid hsl(0deg 0% 20%);
		padding: 10px;
		border-radius: 6px;
	}

	select {
		width: 80px;
		border: none;
		background-color: transparent;
		outline: none;
		color: hsl(0, 0%, 65%);

		&:disabled,
		&:disabled option {
			opacity: 1;
			color: hsl(0, 0%, 65%);

			& option:checked {
				color: white;
			}
		}

		& option:checked,
		& option:active {
			background-color: transparent;
		}
	}

	.setting {
		display: flex;
		justify-content: space-between;
		padding-bottom: 2px;
		margin-bottom: 5px;
	}

	select::-webkit-scrollbar {
		display: none;
	}
</style>
