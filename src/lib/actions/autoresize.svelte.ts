export function autoresize(node: HTMLInputElement) {
	function onInput() {
		const style = getComputedStyle(node);
		const padding =
			parseInt(style.paddingLeft || '0', 10) +
			parseInt(style.paddingRight || '0', 10) +
			parseInt(style.borderWidth || '0');
		const estimatedCursorSize = 2;
		const minWidth = padding + estimatedCursorSize;

		node.style.width = `${getTextWidth(node.value, getCanvasFont(node)) + minWidth}px`;
	}

	$effect(() => {
		onInput();
		node.addEventListener('input', onInput, { passive: true, capture: true });

		return () => {
			node.removeEventListener('input', onInput);
		};
	});
}

let canvas: HTMLCanvasElement;
function getTextWidth(text: string, font: string) {
	canvas ??= document.createElement('canvas');
	const context = canvas.getContext('2d')!;
	context.font = font;
	const metrics = context.measureText(text);
	return metrics.width;
}

function getCssStyle(element: HTMLElement, prop: string) {
	return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
	const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
	const fontSize = getCssStyle(el, 'font-size') || '16px';
	const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

	return `${fontWeight} ${fontSize} ${fontFamily}`;
}
