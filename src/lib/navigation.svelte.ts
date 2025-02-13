import { beforeNavigate, goto } from '$app/navigation';
import { confirm } from './cmpnt/Confirmation.svelte';

export class PreventNavigation {
	#prevent = $state(false);

	constructor(initial = false) {
		this.#prevent = initial;

		beforeNavigate(async ({ to, cancel, willUnload, type, delta }) => {
			if (!this.#prevent) return;

			cancel();
			if (willUnload) return;

			const result = await confirm({
				title: 'Unsaved changes',
				description: 'You have unsaved changes, are you sure you want to leave?'
			});

			if (!result) return;

			this.#prevent = false;
			if (type === 'popstate') {
				if (delta === -1) history.back();
				else history.forward();
			} else if (to?.url) goto(to.url);
		});
	}

	get prevent() {
		return this.#prevent;
	}

	set prevent(prevent: boolean) {
		this.#prevent = prevent;
	}
}
