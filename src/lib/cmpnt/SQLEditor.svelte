<script lang="ts">
	import { Editor } from '@agnosticeng/editor';
	import { ClickHouseDialect } from '@agnosticeng/editor/dialect';
	import { EditorState } from '@codemirror/state';
	import { EditorView, keymap } from '@codemirror/view';

	interface Props {
		value?: string;
		readonly?: boolean;
		onRun?: () => unknown;
	}

	let { value = $bindable(''), readonly = false, onRun }: Props = $props();
</script>

<Editor
	bind:value
	dialect={ClickHouseDialect}
	extensions={[
		EditorState.readOnly.of(readonly),
		EditorView.editable.of(!readonly),
		keymap.of([
			{
				key: 'Mod-Enter',
				preventDefault: true,
				run: () => (onRun?.(), true)
			}
		])
	]}
/>
