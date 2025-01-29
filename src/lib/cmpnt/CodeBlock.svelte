<script lang="ts" module>
	import CodeBlock from './CodeBlock.svelte';

	if (typeof window !== 'undefined') {
		window.customElements.define(
			'code-block',
			class extends HTMLElement {
				constructor() {
					super();
					const shadowRoot = this.attachShadow({ mode: 'open' });
					const props = {
						code: decodeURIComponent(this.getAttribute('code') || ''),
						language: this.getAttribute('language') || 'plaintext'
					};
					mount(CodeBlock, { target: shadowRoot, props });
				}
			}
		);
	}
</script>

<script lang="ts">
	import { Editor } from '@agnosticeng/editor';
	import { ClickHouseDialect } from '@agnosticeng/editor/dialect';
	import { EditorState } from '@codemirror/state';
	import { EditorView } from '@codemirror/view';
	import { mount } from 'svelte';

	interface Props {
		code: string;
		language: string;
	}

	let { code, language }: Props = $props();
</script>

<div class="code-block">
	{#if language === 'sql'}
		<Editor
			value={code}
			dialect={ClickHouseDialect}
			extensions={[EditorState.readOnly.of(true), EditorView.editable.of(false)]}
		/>
	{/if}
</div>

<style>
	.code-block {
		padding: 12px 0;
		border: 1px solid hsl(0, 0%, 34%);
	}
</style>
