<script lang="ts">
	import { MarkdownEditor } from '$lib/cmpnt/MarkdownEditor';
	import Play from '$lib/cmpnt/svg/play.svelte';
	import { renderMarkdown } from '$lib/markdown';
	import '$lib/markdown/styles/tokens.css';
	import type { EditionBlock } from '$lib/server/repositories/blocks';
	import { Editor } from '@agnosticeng/editor';
	import { untrack } from 'svelte';

	interface Props {
		value: string;
		type: EditionBlock['type'];
		readonly?: boolean;
	}

	let { value = $bindable(''), type, readonly }: Props = $props();

	let html = $state('');
	$effect.pre(() => void renderMarkdown(untrack(() => value)).then((v) => (html = v)));

	async function handlePlay() {
		html = await renderMarkdown(value);
	}
</script>

{#if type === 'markdown'}
	<div class="output">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	</div>
	<div class="markdown">
		{#if !readonly}
			<button onclick={handlePlay}><Play size="16" /></button>
		{/if}
		<MarkdownEditor
			readonly
			bind:value
			onRun={() => {
				handlePlay();
				return true;
			}}
		/>
	</div>
{:else if type === 'sql'}
	<Editor bind:value />
{/if}

<style>
	.output {
		margin-bottom: 12px;
	}

	.markdown {
		width: 100%;
		border: 1px solid hsl(0deg 0% 30%);
		border-radius: 3px;
		position: relative;
	}

	button {
		appearance: none;
		outline: none;
		border: none;
		font-size: 10px;
		padding: 0;

		&:is(:hover, :focus-within):not(:disabled) {
			cursor: pointer;
		}
	}

	button {
		position: absolute;
		z-index: 2;
		top: 0;
		right: 0;

		height: 24px;
		aspect-ratio: 1;
		background-color: transparent;
		border-radius: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		color: hsl(0, 0%, 80%);

		&:is(:hover, :focus-within):not(:disabled) {
			color: hsl(0, 0%, 90%);
		}
	}
</style>
