<script lang="ts" module>
	const ORDER_BY = ['trends', 'likes', 'title', 'createdAt'] as const;

	const ORDER_BY_LABEL_MAP = {
		trends: 'Trends',
		likes: 'Likes',
		title: 'Title',
		createdAt: 'Creation date'
	} as const;

	export function parseBy(value: string | null): Required<Props>['by'] {
		if (!value) return 'trends';

		// @ts-expect-error we are checking value here
		return ORDER_BY.includes(value) ? value : 'trends';
	}

	export function parseDir(value: string | null): 'asc' | 'desc' {
		return value === 'asc' || value === 'desc' ? value : 'desc';
	}
</script>

<script lang="ts">
	import Select from './Select.svelte';
	import Check from './svg/check.svelte';
	import SortAscending from './svg/sort-ascending.svelte';
	import SortDescending from './svg/sort-descending.svelte';

	interface Props {
		by?: (typeof ORDER_BY)[number];
		direction?: 'asc' | 'desc';
		onchange?: (value: { by: (typeof ORDER_BY)[number]; direction: 'asc' | 'desc' }) => void;
	}

	let { by = $bindable('likes'), direction = $bindable('desc'), onchange }: Props = $props();

	let select = $state<ReturnType<typeof Select>>();
	let container = $state<HTMLDivElement>();

	function handleItemClick(item: NonNullable<Props['by']>) {
		if (item !== by) {
			by = item;
			direction = item === 'title' ? 'asc' : 'desc';

			onchange?.({ by, direction });
		}

		select?.close();
	}
</script>

<div class="container" bind:this={container}>
	<button aria-label="Sort by" title="Sort by {by}" onclick={() => select?.open()}>
		{ORDER_BY_LABEL_MAP[by]}
	</button>
	<span class="separator"></span>
	<button
		aria-label="{direction}ending"
		title="{direction}ending"
		onclick={() => {
			direction = direction === 'desc' ? 'asc' : 'desc';
			onchange?.({ by, direction });
		}}
	>
		{#if direction === 'desc'}
			<SortDescending size="12" />
		{:else}
			<SortAscending size="12" />
		{/if}
	</button>
</div>

<Select anchor={container} anchor_size bind:this={select}>
	<ul role="listbox">
		<li role="presentation">
			<h4>Order By</h4>
			<ul role="group">
				{#each ORDER_BY as value}
					{@const checked = value === by}
					<li
						role="option"
						aria-selected={checked}
						tabindex="0"
						onclick={() => handleItemClick(value)}
						onkeydown={(e) => ['Enter', ' '].includes(e.key) && e.currentTarget.click()}
					>
						{ORDER_BY_LABEL_MAP[value]}
						<Check size="12" style={`opacity: ${checked ? '1' : '0'}`} />
					</li>
				{/each}
			</ul>
		</li>
	</ul>
</Select>

<style>
	.container {
		flex-shrink: 0;
		display: flex;
		gap: 8px;
		border: 1px solid hsl(0, 0%, 20%);
		padding: 6px 8px;
		border-radius: 5px;
	}

	.container > * {
		flex-shrink: 0;
		cursor: pointer;
	}

	.container > button:first-child {
		min-width: 80px;
		text-align: start;
		font-size: 12px;
		flex-grow: 1;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style-type: none;
	}

	ul[role='listbox'] {
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;
		border: 1px solid hsl(0, 0%, 15%);
		border-radius: 6px;
	}

	li[role='option'] {
		font-size: 12px;
		cursor: pointer;
		line-height: 20px;
		color: hsl(0, 0%, 80%);
		list-style-type: none;
		height: 36px;
		width: 100%;
		padding: 0 8px;
		border-radius: 5px;
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
	}

	li[role='option'][aria-selected='true'] {
		color: hsl(0, 0%, 90%);
		font-weight: 500;
	}

	li[role='option']:hover {
		background-color: hsl(0, 0%, 15%);
	}

	h4 {
		font-size: 13px;
		color: hsl(0, 0%, 65%);
		height: 32px;
		display: flex;
		align-items: center;
		padding: 0 8px;
		margin: 0;
		font-weight: 400;
	}

	.separator {
		width: 1px;
		background-color: hsl(0, 0%, 20%);
	}
</style>
