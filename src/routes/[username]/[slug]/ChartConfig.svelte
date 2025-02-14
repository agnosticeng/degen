<script lang="ts">
	import Select from '$lib/cmpnt/Select.svelte';
	import Cog6Tooth from '$lib/cmpnt/svg/cog-6-tooth.svelte';
	import type { ColumnDescriptor } from '$lib/server/proxy';
	import type { ChartSettingsType } from '@agnosticeng/dv';

	interface Props {
		settings?: ChartSettingsType | { chartType: 'table' };
		columns: ColumnDescriptor[];
	}

	let { settings = $bindable({ chartType: 'table' }), columns }: Props = $props();

	let select = $state<ReturnType<typeof Select>>();
	let anchor = $state<HTMLButtonElement>();

	function handleChartTypeChange(
		e: Event & {
			currentTarget: EventTarget & HTMLSelectElement;
		}
	) {
		const value = e.currentTarget.value as 'table' | 'line' | 'candle';
		if (value === 'table') {
			settings = { chartType: 'table' };
		} else {
			const { chartType, ...previous } = settings;
			settings = {
				chartType: value,
				xAxis: { series: [] },
				yAxis: { series: [] },
				...previous
			};
		}
	}

	const handleXAxisChange = (event: Event) => {
		const select = event.target as HTMLSelectElement;
		const selectedOptions = Array.from(select.selectedOptions).map((option) => option.value);
		if (settings.chartType !== 'table') settings.xAxis.series = selectedOptions;
	};

	const handleYAxisChange = (event: Event) => {
		const select = event.target as HTMLSelectElement;
		const selectedOptions = Array.from(select.selectedOptions).map((option) => option.value);
		if (settings.chartType !== 'table') settings.yAxis.series = selectedOptions;
	};
</script>

<button bind:this={anchor} onclick={() => select?.open()}>
	<Cog6Tooth size="14" />
</button>

<Select bind:this={select} {anchor} placement="bottom-end">
	<form>
		<div class="setting">
			<span>type</span>
			<select multiple value={settings.chartType} onchange={handleChartTypeChange} size="3">
				<option value="table">table</option>
				<option value="line">line</option>
				<option value="candle">candle</option>
			</select>
		</div>
		{#if settings.chartType === 'candle' || settings.chartType === 'line'}
			<div class="setting">
				<span>x-axis</span>
				<select
					multiple
					value={settings.xAxis.series}
					onchange={handleXAxisChange}
					size={columns.length}
				>
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
						value={settings.yAxis.series}
						onchange={handleYAxisChange}
						size={columns.length}
					>
						{#each columns as column}
							<option value={column.name}>{column.name}</option>
						{/each}
					</select>
				</div>
			</div>
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
