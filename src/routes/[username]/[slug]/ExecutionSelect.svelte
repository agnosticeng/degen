<script lang="ts">
	import Select from '$lib/cmpnt/Select.svelte';
	import CheckCircle from '$lib/cmpnt/svg/check-circle.svelte';
	import Loader from '$lib/cmpnt/svg/loader.svelte';
	import WarningCircle from '$lib/cmpnt/svg/warning-circle.svelte';
	import type { ExecutionWithResultURL } from '$lib/server/proxy';

	interface Props {
		selected: ExecutionWithResultURL;
		executions: ExecutionWithResultURL[];
	}

	let { selected = $bindable(), executions }: Props = $props();

	let select: ReturnType<typeof Select>;
	let button = $state<HTMLButtonElement>();

	function handleSelect(value: ExecutionWithResultURL) {
		selected = value;
		select.close();
	}

	let opened = $state(false);
	function handleOpen() {
		select.open();
		opened = true;
	}
</script>

<div>
	<span>Result: </span>
	<button bind:this={button} onclick={handleOpen} class:opened>
		{#if selected.status === 'PENDING' || selected.status === 'RUNNING'}
			<Loader size="14" />
			<i>An execution is running...</i>
		{:else}
			<span>{selected.created_at.toLocaleString()}</span>
		{/if}
	</button>
</div>

<Select
	bind:this={select}
	anchor_size
	anchor={button}
	placement="bottom-end"
	onClose={() => (opened = false)}
>
	<ul role="menu">
		{#each executions as execution (execution.id)}
			<li role="menuitem" aria-current={selected.id === execution.id}>
				<button
					onclick={() => handleSelect(execution)}
					title="Execution {execution.status.toLowerCase()}"
					disabled={execution.status === 'PENDING' || execution.status === 'RUNNING'}
				>
					{#if execution.status === 'SUCCEEDED'}
						<CheckCircle size="14" />
					{:else if execution.status === 'FAILED'}
						<WarningCircle size="14" color="hsl(0deg 100% 90%)" />
					{:else if execution.status === 'PENDING' || execution.status === 'RUNNING'}
						<Loader size="14" />
					{/if}
					{#if execution.status === 'PENDING' || execution.status === 'RUNNING'}
						<i>An execution is running...</i>
					{:else}
						<span>{execution.created_at.toLocaleString()}</span>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
</Select>

<style>
	div {
		font-size: 12px;
		display: flex;
		align-items: center;
		gap: 6px;

		& > button {
			padding: 4px 8px;
			padding-right: 24px;
			background-position: right 8px center;
			background-repeat: no-repeat;
			background-image: url($lib/cmpnt/svg/select-arrow-down.svg);
			background-color: hsl(0, 0%, 10%);
			border-radius: 5px;
			border: 1px solid hsl(0, 0%, 15%);
			color: inherit;

			display: flex;
			align-items: center;
			gap: 8px;

			&:is(.opened, :hover) {
				background-color: hsl(0, 0%, 15%);
			}
		}
	}

	ul[role='menu'] {
		list-style: none;
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;
		font-size: 12px;

		& > li {
			display: block;
			padding: 0;

			&:is([aria-current='true']) > button {
				background-color: hsl(0, 0%, 15%);
			}

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

				&:is(:disabled) {
					color: hsl(0, 0%, 65%);
				}
			}
		}
	}
</style>
