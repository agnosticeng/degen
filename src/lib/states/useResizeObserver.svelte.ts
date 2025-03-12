type Getter<T> = () => T;
type MaybeGetter<T> = T | Getter<T>;

export function useResizeObserver(
	target: MaybeGetter<HTMLElement | HTMLElement[] | null | undefined>,
	callback: ResizeObserverCallback,
	options: ResizeObserverOptions = {}
) {
	let observer: ResizeObserver | undefined;

	const targets = $derived.by(() => {
		const value = extract(target);
		return new Set(value ? (Array.isArray(value) ? value : [value]) : []);
	});

	$effect(() => {
		if (!targets.size || !window) return;
		observer = new window.ResizeObserver(callback);
		for (const el of targets) observer.observe(el, options);

		return () => {
			observer?.disconnect();
			observer = undefined;
		};
	});
}

function extract<T>(value: MaybeGetter<T>, defaultValue?: T): T {
	if (typeof value === 'function') {
		const getter = value as Getter<T>;
		return getter() ?? defaultValue ?? getter();
	}

	return value ?? defaultValue ?? value;
}
