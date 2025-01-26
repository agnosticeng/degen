<script lang="ts">
	import { autoresize } from '$lib/actions/autoresize.svelte';
	import DOMPurify from 'dompurify';
	import { Marked } from 'marked';
	import { untrack } from 'svelte';
	import type { Block } from './types';

	let blocks = $state<Block[]>([]);
	let opens = $state<Record<Block['id'], boolean>>({});

	$effect.pre(() => {
		if (!untrack(() => blocks.length)) {
			const block: Block = {
				id: crypto.randomUUID(),
				input: '## Welcome to your new Notebook',
				type: 'markdown'
			};
			blocks = [block];
			opens[block.id] = true;
		}
	});

	const marked = new Marked({
		gfm: true,
		renderer: {
			code({ text, lang }) {
				if (lang !== 'sql') return '';
				return `<code>${text}</code>`;
			}
		},
		hooks: {
			postprocess(html) {
				return DOMPurify.sanitize(html);
			}
		}
	});

	function addBlock(atIndex: number, type: Block['type']) {
		const block: Block = { id: crypto.randomUUID(), input: '', type };
		blocks.splice(atIndex, 0, block);
		opens[block.id] = true;
	}
</script>

<section>
	{#each blocks as block, i}
		<article>
			<div class="preview">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html marked.parse(block.input, { async: false })}
			</div>
			{#if block.type === 'markdown'}
				<details class="markdown" open={opens[block.id]}>
					<summary>
						<button onclick={() => (opens[block.id] = !opens[block.id])}>{'>'}</button>
					</summary>
					<textarea
						use:autoresize
						class="input"
						bind:value={block.input}
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
					></textarea>
				</details>
			{/if}
		</article>
		<div class="add-block">
			<button onclick={() => addBlock(i + 1, 'markdown')}>+</button>
		</div>
	{/each}
</section>

<style>
	section {
		max-width: 1024px;
		margin: 0 auto;
		padding: 20px 20px;
	}

	.preview {
		margin-bottom: 12px;
	}

	.markdown {
		width: 100%;
		border: 1px solid hsl(0deg 0% 30%);
		border-radius: 3px;
	}

	.input {
		width: 100%;
		padding: 10px 14px;
		border: none;
		outline: none;
		color: white;

		overflow: auto;
		resize: none;

		font-family: ui-monospace, monospace;
		white-space: pre;

		background-color: transparent;
		caret-color: hsl(218deg 11% 65%);
	}

	summary {
		height: 0;
		list-style: none;
		position: relative;

		& > button {
			position: absolute;
			right: 100%;
			top: -12px;

			color: hsl(218deg 11% 65%);

			height: 20px;
			aspect-ratio: 1;
			transform-origin: center;
			transition: transform 200ms linear;
			transform: rotate(0deg);
		}

		&::marker {
			display: none;
		}
	}

	details[open] > summary > button {
		transform: rotate(90deg);
	}

	div.add-block {
		position: relative;
		height: 2px;
		background-color: transparent;
		width: 100%;
		margin: 12px 0;

		&:hover {
			background-color: hsl(0deg 0% 30%);

			& > button {
				opacity: 1;
			}
		}

		& > button {
			color: hsl(218deg 11% 65%);
			position: absolute;
			right: 100%;
			top: -10px;
			height: 20px;
			aspect-ratio: 1;

			display: flex;
			align-items: center;
			justify-content: center;

			opacity: 0;
			font-size: 18px;
		}
	}

	button {
		appearance: none;
		background-color: transparent;
		outline: none;
		border: none;
		padding: 0;

		&:is(:hover) {
			cursor: pointer;
		}
	}
</style>
