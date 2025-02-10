<script lang="ts">
	import { MarkdownEditor } from '$lib/cmpnt/MarkdownEditor';
	import Select from '$lib/cmpnt/Select.svelte';
	import SqlEditor from '$lib/cmpnt/SQLEditor.svelte';
	import CaretDown from '$lib/cmpnt/svg/caret-down.svelte';
	import DotsThreeVertical from '$lib/cmpnt/svg/dots-three-vertical.svelte';
	import Loader from '$lib/cmpnt/svg/loader.svelte';
	import Pin from '$lib/cmpnt/svg/pin.svelte';
	import Play from '$lib/cmpnt/svg/play.svelte';
	import Trash from '$lib/cmpnt/svg/trash.svelte';
	import { renderMarkdown } from '$lib/markdown';
	import type { ExecutionWithResultURL, ProxyResult } from '$lib/server/proxy';
	import type { Block, EditionBlock } from '$lib/server/repositories/blocks';
	import { Table } from '@agnosticeng/dv';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import ExecutionSelect from './ExecutionSelect.svelte';
	import './markdown.css';

	interface Props {
		block: EditionBlock | (Block & { executions?: ExecutionWithResultURL[] });
		onDelete: (block: EditionBlock) => unknown;
		readonly?: boolean;
	}

	let { block = $bindable(), onDelete, readonly = false }: Props = $props();

	let open = $state(!block.id || block.pinned);
	let select = $state<ReturnType<typeof Select>>();
	let anchor = $state<HTMLElement>();

	let promise = $state<Promise<string | ProxyResult | undefined>>()!;
	let selectedExecution = $state.raw(getLast(block));
	function getLast(block: Props['block']) {
		if ('executions' in block) {
			return block.executions?.find((e) => e.status === 'SUCCEEDED') ?? block.executions?.at(0);
		}
	}

	$effect(() => {
		if (selectedExecution) {
			if (selectedExecution.status === 'SUCCEEDED') {
				promise = fetchResult(selectedExecution);
			} else error = selectedExecution.error ?? '';
		}
	});

	onMount(async () => {
		if (!block.content) return;
		try {
			if (block.type === 'markdown') {
				promise = renderMarkdown(block.content).catch((e) => {
					if (e instanceof Error) error = e.message;
					else console.error(e);
					return '';
				});
			}

			if (block.type === 'sql' && selectedExecution) {
				if (selectedExecution.status === 'SUCCEEDED') {
					promise = fetchResult(selectedExecution);
				} else error = selectedExecution.error ?? '';
			}
		} catch (e) {
			console.error(e);
		}
	});

	async function fetchResult(execution: ExecutionWithResultURL): Promise<ProxyResult | undefined> {
		const response = await fetch(execution.result_url);
		if (response.ok) return await response.json();
	}

	let contentSnapshot = $state(block.content);
	const dirty = $derived(contentSnapshot !== block.content);
	let error = $state<string>('');

	async function handleRun() {
		if (!dirty) return;

		error = '';

		if (block.type === 'markdown') {
			if (block.content)
				promise = renderMarkdown(block.content).catch((e) => {
					if (e instanceof Error) error = e.message;
					else console.error(e);
					return '';
				});
			else promise = Promise.resolve('');
		}

		contentSnapshot = block.content;
	}
</script>

<article>
	<div class="gutter" bind:this={anchor}>
		<button
			class="chevron"
			disabled={block.pinned}
			class:rotate={!open && !block.pinned}
			onclick={() => (open = !open)}
		>
			<CaretDown size="14" />
		</button>
		<span></span>
		<button class="more" onclick={() => select?.open()}>
			<DotsThreeVertical size="14" />
		</button>
	</div>
	{#if block.type === 'sql'}
		{#if 'executions' in block && block.executions?.length}
			<div class="cell-header">
				<ExecutionSelect
					bind:selected={selectedExecution!}
					executions={$state.snapshot(block.executions)}
				/>
			</div>
		{/if}
	{/if}
	<div class="cell-content">
		{#await promise}
			<div class="loading-container">
				<Loader size="14" />
			</div>
		{:then result}
			{#if typeof result === 'string' && result && block.type === 'markdown'}
				<div class="output markdown-body">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html result}
				</div>
			{/if}
			{#if typeof result === 'object' && block.type === 'sql'}
				<div class="output sql" class:error>
					{#if result}
						<Table data={result.data} columns={result.meta} />
					{:else if error}
						<span>{error}</span>
					{/if}
				</div>
			{/if}
		{:catch e}
			{console.error(e)}
		{/await}
		{#if open || block.pinned}
			<div class="input" transition:slide={{ duration: 200 }}>
				{#if block.type === 'markdown' && !readonly}
					<button onclick={handleRun} class:dirty>
						<Play size="14" />
					</button>
				{/if}
				{#if block.type === 'sql'}
					<SqlEditor bind:value={block.content} onRun={() => handleRun()} {readonly} />
				{:else if block.type === 'markdown'}
					<MarkdownEditor bind:value={block.content} onRun={() => handleRun()} {readonly} />
				{/if}
			</div>
		{/if}
	</div>
</article>

<Select bind:this={select} placement="right-start" {anchor}>
	<ul role="menu">
		<li role="menuitem">
			<button
				onclick={() => {
					block.pinned = !block.pinned;
					select?.close();
				}}
			>
				<Pin size="14" />
				{#if block.pinned}
					Unpin
				{:else}
					Pin
				{/if}
			</button>
		</li>
		{#if !readonly}
			<li><span class="separator"></span></li>
			<li role="menuitem">
				<button class="danger" onclick={() => onDelete(block)} disabled={readonly}>
					<Trash size="14" /> Delete
				</button>
			</li>
		{/if}
	</ul>
</Select>

<style>
	article {
		position: relative;
		min-height: 30px;
	}

	article + :global(article) {
		margin-top: 20px;
	}

	.cell-header {
		height: 30px;
		border-top-right-radius: 3px;
		transition: background-color 100ms ease-in;
		padding: 0 10px;

		display: flex;
		align-items: center;
		justify-content: end;
	}

	.cell-header ~ .cell-content .output {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	.gutter {
		position: absolute;
		left: calc((100% - 100vw) / 2);
		top: 0;
		bottom: 0;
		width: calc((100vw - 100%) / 2);
		container-type: inline-size;

		display: flex;
		flex-direction: row;
		align-items: stretch;

		opacity: 0;
		transition: opacity 100ms ease-in;

		& button {
			display: flex;
			align-items: start;
			padding: 6px 2px;
			color: hsl(0, 0%, 80%);

			&:hover:not(:disabled) {
				color: hsl(0, 0%, 90%);
			}

			&:disabled {
				color: hsl(0, 0%, 65%);
			}
		}

		& .chevron {
			flex: 1;
			justify-content: end;

			& > :global(svg) {
				transition: transform 0.2s ease;
			}

			&.rotate > :global(svg) {
				transform: rotate(-90deg);
			}

			@container (max-width: 40px) {
				& {
					display: none;
				}
			}
		}

		& > span {
			flex: 1;
			display: none;

			@container (max-width: 40px) {
				& {
					display: block;
				}
			}
		}

		& .more {
			flex-shrink: 0;
			width: 20px;
			height: 100%;
			justify-content: center;
			border-top-left-radius: 3px;
			border-bottom-left-radius: 3px;
			background-color: hsl(0, 0%, 15%);
		}
	}

	article:is(:hover) .cell-header {
		background-color: hsl(0, 0%, 15%);
	}

	article:is(:focus-within) .cell-header,
	article:is(:focus-within) .more {
		background-color: hsl(212, 55%, 20%);
	}

	article:is(:hover, :focus-within) :global(.cm-editor) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	article:is(:hover, :focus-within) .gutter {
		opacity: 1;
	}

	article:is(:hover) .output {
		border-color: hsl(0, 0%, 10%);
	}

	article:is(:focus-within) .input :global(.cm-editor) {
		background-color: hsl(214, 14%, 18%);
	}

	article:is(:focus-within) .output {
		border-color: hsl(214, 14%, 18%);
	}

	.output {
		padding-bottom: 12px;
		padding-left: 2px;
		border: 1px solid transparent;
		border-left: none;
		border-radius: 3px;

		&:has(+ .input) {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		& + .input :global(.cm-editor) {
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}

		& > :global(*:last-child) {
			margin-bottom: 0;
		}

		&.error {
			font-family: monospace;
			font-size: 11px;
			color: hsl(0deg 100% 90%);
		}

		&.sql {
			max-height: 370px;
			overflow: auto;
		}
	}

	.loading-container {
		padding-top: 5px;
		display: flex;
		align-items: center;
	}

	.input {
		width: 100%;
		position: relative;

		& :global {
			.cm-editor {
				border-radius: 3px;
				background-color: hsl(0, 0%, 10%);
			}

			.cm-scroller {
				overflow: auto;
				min-height: 30px;
			}

			.cm-gutters {
				display: none;
			}

			.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground {
				background-color: hsl(180, 20%, 23%);
			}
		}

		button {
			height: 20px;
			aspect-ratio: 1;
			display: flex;
			align-items: center;
			justify-content: center;

			position: absolute;
			top: 4px;
			right: 4px;
			z-index: 2;

			color: hsl(0, 0%, 80%);
			border-radius: 3px;

			&.dirty > :global(svg) {
				fill: currentColor;
			}

			&:not(:disabled):hover {
				background-color: hsl(214, 14%, 23%);
				color: hsl(0, 0%, 90%);
			}

			&:not(:disabled):active {
				background-color: hsl(214, 14%, 26%);
			}
		}
	}

	ul[role='menu'] {
		list-style: none;
		background-color: hsl(0, 0%, 10%);
		padding: 8px 0;
		margin: 0;

		& > li {
			display: block;
			padding: 0;

			& > span.separator {
				display: block;
				width: 100%;
				height: 1px;
				margin: 4px 0;
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

					&.danger {
						color: hsl(0deg 61% 54%);
						background-color: hsl(0, 34%, 12%);
					}
				}

				&:is(:disabled) {
					color: hsl(0, 0%, 65%);
				}
			}
		}
	}
</style>
