import { tick } from 'svelte';

type Target = HTMLElement | string;

export function portal(node: HTMLElement, target: Target = 'body') {
	let targetNode;

	async function update() {
		if (typeof target === 'string') {
			targetNode = document.querySelector(target);
			if (targetNode === null) {
				await tick();
				targetNode = document.querySelector(target);
			}
			if (targetNode === null) {
				throw new Error(`Invalid CSS selector: "${target}"`);
			}
		} else if (target instanceof HTMLElement) {
			targetNode = target;
		} else {
			throw new TypeError(
				`Unknown portal target type: ${
					target === null ? 'null' : typeof target
				}. Allowed types: string (CSS selector) or HTMLElement.`
			);
		}
		targetNode.appendChild(node);
		node.setAttribute('data-portal', '');
	}

	$effect(() => {
		update();
		return () => {
			if (node.parentNode) node.parentNode.removeChild(node);
		};
	});
}
