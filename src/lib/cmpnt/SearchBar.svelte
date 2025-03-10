<script lang="ts">
	import Search from '$lib/cmpnt/svg/search.svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';

	type Props = Omit<
		SvelteHTMLElements['input'],
		'type' | 'autocapitalize' | 'autocomplete' | 'autocorrect' | 'placeholder' | 'checked'
	>;

	let { value = $bindable(), ...rest }: Props = $props();
</script>

<label>
	<Search size="14" />
	<input
		type="text"
		autocapitalize="off"
		autocomplete="off"
		autocorrect="off"
		placeholder="Search..."
		bind:value
		{...rest}
	/>
</label>

<style>
	label {
		width: 100%;
		background-color: hsl(0deg 0% 3%);
		border: 1px solid hsl(0deg 0% 20%);
		border-radius: 8px;

		display: flex;
		align-items: center;
		gap: 10px;
		padding: 5px 10px;

		& > input {
			flex: 1;
			height: 32px;
		}

		&:has(> input:is(:focus-within, :hover)) {
			border-color: hsl(0deg 0% 34%);
		}
	}

	input {
		background: none;
		border: none;
		outline: none;
		caret-color: currentcolor;
	}
</style>
