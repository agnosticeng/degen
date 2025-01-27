import { theme } from '@agnosticeng/editor';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
	defaultKeymap,
	history,
	historyKeymap,
	indentLess,
	insertTab,
	toggleComment
} from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { bracketMatching, indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { drawSelection, EditorView, keymap } from '@codemirror/view';

const keymaps = keymap.of([
	// Mod-Enter is reserved
	...defaultKeymap.filter((binding) => binding.key !== 'Mod-Enter'),
	// default is Mod-/ and it works fine on querty keyboard but not on azerty.
	{ key: 'Mod-Shift-/', run: toggleComment, preventDefault: true },
	...historyKeymap,
	...closeBracketsKeymap,
	{
		key: 'Tab',
		preventDefault: true,
		run: insertTab
	},
	{
		key: 'Shift-Tab',
		preventDefault: true,
		run: indentLess
	}
]);

export const extensions = [
	history(),
	bracketMatching(),
	closeBrackets(),
	EditorState.tabSize.of(2),
	indentUnit.of('\t'),
	EditorView.darkTheme.of(true),
	drawSelection(),
	theme,
	keymaps,
	markdown()
];
