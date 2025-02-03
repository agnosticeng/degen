export function autoresize(node: HTMLElement) {
	function onInput() {
		node.style.height = '0px';
		node.style.height = `${node.scrollHeight}px`;
	}

	$effect(() => {
		onInput();
		node.addEventListener('input', onInput, { passive: true, capture: true });

		return () => {
			node.removeEventListener('input', onInput);
		};
	});
}
