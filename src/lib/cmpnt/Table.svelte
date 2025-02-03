<script lang="ts">
	import type { ProxyResponse } from '$lib/proxy';

	interface Props {
		response: ProxyResponse;
	}

	let { response }: Props = $props();

	const columns = $derived(response.meta);
	const rows = $derived(response.data);

	function formatValue(value: unknown) {
		if (value === null) return 'NULL';
		if (value === undefined) return 'UNDEFINED';
		if (Array.isArray(value)) return JSON.stringify(value);
		return value as string | { toString(): string };
	}
</script>

<table>
	<thead>
		<tr>
			<th>
				<div class="th-content index">
					<span>#</span>
				</div>
			</th>
			{#each columns as { name, type }}
				<th>
					<div class="th-content">
						<span>{name} <i>({type.replace(/Nullable\((.*)\)/, '$1')})</i></span>
					</div>
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each rows as row, i}
			<tr>
				<td class="text-right">
					<div class="td-content index">{i}</div>
				</td>
				{#each columns as { name, type }}
					{@const value = row[name]}
					{@const isNumberType =
						type.toLowerCase().includes('int') || type.toLowerCase().includes('float')}
					{@const isDateType = type.toLowerCase().includes('date')}
					<td class:text-right={isNumberType || isDateType}>
						<div class="td-content">{formatValue(value)}</div>
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	td,
	th {
		padding: 0 10px;
		height: 26px;
		text-align: left;
		font-family: monospace;
		cursor: default;
		position: relative;
		white-space: nowrap;
		overflow: hidden;
		width: max-content;
		min-width: 200px;
	}

	:where(td, th):has(> .index) {
		min-width: 0;
	}

	.text-right {
		text-align: right;
	}

	.th-content,
	.td-content {
		overflow: hidden;
		white-space: nowrap;
		color: hsl(0deg 0% 80%);
		position: relative;
	}

	i {
		font-size: 10px;
		font-style: normal;
		color: hsl(0deg 0% 60%);
	}

	th {
		text-align: center;
		background-color: hsl(0deg 0% 5%);
		position: sticky;
		top: 0;
		z-index: 1;
		border-bottom: 1px solid hsl(0deg 0% 12%);
		font-weight: 400;
		cursor: pointer;
		user-select: none;
	}

	table {
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
		font-size: 11px;
	}

	tr:hover td {
		background-color: hsl(0deg 0% 10%);
	}

	tr:nth-child(odd) td {
		background-color: hsl(0deg 0% 7%);
	}

	tr:nth-child(even) td {
		background-color: hsl(0deg 0% 4%);
	}
</style>
