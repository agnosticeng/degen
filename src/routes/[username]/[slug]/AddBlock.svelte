<script lang="ts">
	import Select from '$lib/cmpnt/Select.svelte';
	import Database from '$lib/cmpnt/svg/database.svelte';
	import Plus from '$lib/cmpnt/svg/plus.svelte';
	import TextLeft from '$lib/cmpnt/svg/text-left.svelte';
	import type { Block } from '$lib/server/repositories/blocks';

	interface Props {
		onNewBlock: (type: Block['type']) => void;
	}

	let { onNewBlock }: Props = $props();
	let select: ReturnType<typeof Select>;
</script>

<div>
	<button class="add-block" onclick={(e) => select.open(e.currentTarget)}>
		<Plus size="14" />
	</button>
</div>

<Select bind:this={select} placement="right-start">
	<ul role="menu">
		<li role="menuitem">
			<button
				onclick={() => {
					onNewBlock('markdown');
					select.close();
				}}
			>
				<TextLeft size="14" />Markdown
			</button>
		</li>
		<li role="menuitem">
			<button
				onclick={() => {
					onNewBlock('sql');
					select.close();
				}}
			>
				<Database size="14" />SQL
			</button>
		</li>
	</ul>
</Select>

<style>
	div {
		height: 20px;
		margin: 5px 0;
		position: relative;
	}

	button {
		appearance: none;
		outline: none;
		border: none;
		background-color: transparent;
		color: currentColor;
		padding: 0;

		&:is(:hover, :focus-within):not(:disabled) {
			cursor: pointer;
		}
	}

	.add-block {
		position: absolute;
		top: 0;
		right: 100%;
		height: 20px;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;

		color: hsl(0, 0%, 80%);
		transition: color 100ms ease-out;

		&:is(:hover):not(:disabled) {
			color: hsl(0, 0%, 90%);

			&::before {
				background-color: currentColor;
			}
		}
	}

	ul {
		list-style: none;
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;

		& > li {
			display: block;
			padding: 0;

			& > button {
				width: 100%;
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 16px;
				color: hsl(0, 0%, 80%);

				&:is(:hover, :focus-within):not(:disabled) {
					color: hsl(0, 0%, 90%);
					background-color: hsl(0, 0%, 15%);
				}
			}
		}
	}
</style>
