<script lang="ts">
	import '@agnosticeng/editor/style.css';
	import { Compartment, EditorState } from '@codemirror/state';
	import { EditorView, keymap } from '@codemirror/view';
	import { untrack } from 'svelte';
	import { extensions } from './extensions';

	interface Props {
		value?: string;
		onRun?: () => boolean;
		readonly?: boolean;
	}

	let { value = $bindable(''), onRun = () => true, readonly = false }: Props = $props();

	let container: HTMLDivElement;
	let view: EditorView;
	const readonlyCompartment = new Compartment();

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
				readonlyCompartment.of(
					untrack(() => readonly)
						? [EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly)]
						: []
				),
				keymap.of([
					{
						key: 'Mod-Enter',
						preventDefault: true,
						run: () => onRun()
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

	$effect(() => {
		view?.dispatch({
			effects: readonlyCompartment.reconfigure(
				readonly ? [EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly)] : []
			)
		});
	});
</script>

<div bind:this={container}></div>

<style>
	div {
		height: 100%;
		width: 100%;
	}
</style>
