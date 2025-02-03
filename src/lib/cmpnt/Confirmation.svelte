<script lang="ts" module>
	import { mount, unmount } from 'svelte';
	import Confirmation from './Confirmation.svelte';

	export function confirm(config: Omit<Props, 'onClose'>) {
		const { promise, resolve } = Promise.withResolvers<boolean>();

		const confirmation = mount(Confirmation, {
			target: document.body,
			intro: true,
			props: {
				...config,
				onClose: (result) => {
					resolve(result);
					unmount(confirmation);
				}
			}
		});

		return promise;
	}
</script>

<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		title: string;
		description: string;
		buttons?: {
			confirm?: string;
			cancel?: string;
		};
		danger?: boolean;
		onClose: (confirm: boolean) => void;
	}

	let { title, description, buttons = {}, danger = false, onClose }: Props = $props();

	let modal = $state<ReturnType<typeof Modal>>();
	let open = $state(true);
	let confirmed = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		confirmed = true;
		modal?.close();
	}

	function handleClose() {
		open = false;
		onClose(confirmed);
	}
</script>

{#if open}
	<Modal bind:this={modal} onclose={handleClose}>
		<form onsubmit={handleSubmit} class:danger>
			<h1>{title}</h1>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<h2>{@html description}</h2>
			<footer>
				<button type="button" onclick={() => modal?.close()}>{buttons.cancel ?? 'Cancel'}</button>
				<button type="submit">{buttons.confirm ?? 'Confirm'}</button>
			</footer>
		</form>
	</Modal>
{/if}

<style>
	form {
		padding: 2rem;
		background-color: hsl(0, 0%, 7%);
		color: hsl(0, 0%, 86%);
	}

	h1 {
		font-size: 16px;
		margin-bottom: 6px;
	}

	h2 {
		font-weight: 400;
		font-size: 12px;
		color: hsl(0, 0%, 65%);
		margin-bottom: 30px;
	}

	footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		height: 28px;
		margin-top: 12px;
	}

	button {
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background-color: transparent;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 6px;

		&[type='submit'] {
			background-color: hsl(0, 0%, 12%);
		}

		&:hover {
			background-color: hsl(0, 0%, 15%);
			color: hsl(0, 0%, 90%);
		}
	}

	form.danger > footer > button[type='submit']:hover {
		color: hsl(0deg 61% 54%);
		background-color: hsl(0, 34%, 12%);
	}
</style>
