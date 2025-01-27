<script lang="ts">
	import '@agnosticeng/editor/style.css';
	import { EditorState } from '@codemirror/state';
	import { EditorView, keymap } from '@codemirror/view';
	import { untrack } from 'svelte';
	import { extensions } from './extensions';

	interface Props {
		value?: string;
		onRun?: () => boolean;
	}

	let { value = $bindable(''), onRun = () => true }: Props = $props();

	let container: HTMLDivElement;
	let view: EditorView;

	$effect(() => {
		if (!container) return;
		view = new EditorView({ parent: container });

		const state = EditorState.create({
			doc: untrack(() => value),
			extensions: [
				extensions,
				EditorView.updateListener.of((update) => {
					if (update.docChanged) value = update.state.doc.toString();
				}),
				keymap.of([
					{
						key: 'Mod-Enter',
						preventDefault: true,
						run: (view) => onRun()
					}
				])
			]
		});

		view.setState(state);

		return () => view.destroy();
	});

	$effect(() => {
		const existing = view?.state.doc.toString() ?? '';
		if (value !== existing)
			view?.dispatch({ changes: { from: 0, to: existing.length, insert: value } });
	});
</script>

<div bind:this={container}></div>
