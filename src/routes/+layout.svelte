<script>
	import Search from '$lib/cmpnt/svg/search.svelte';
</script>

<section class="app">
	<header>
		<span><h1>degen</h1></span>
		<span><button class="sign-in">Sign in</button><Search size={20} /></span>
	</header>
	<slot></slot>
</section>

<style>
	:global(html, body) {
		background: hsl(0, 0%, 10%);
		margin: 0;
	}
	:global(*) {
		box-sizing: border-box;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	.app {
		color: hsl(0, 0%, 86%);
		width: 100%;
	}

	header {
		border-bottom: 1px solid hsl(0, 0%, 20%);
		padding: 0 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
	}

	header h1 {
		font-weight: 1000;
		font-size: 18px;
		margin: 0;
	}

	button {
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		padding: 8px 16px;
		color: hsl(0, 0%, 80%);
		border-radius: 5px;
		background: hsl(0, 0%, 5%);
		transition: all 0.2s ease;
	}

	button:hover {
		background: hsl(0, 0%, 8%);
		color: hsl(0, 0%, 90%);
	}

	.sign-in {
		margin-right: 10px;
	}

	header span {
		height: 24px;
		display: flex;
		align-items: center;
	}
</style>
