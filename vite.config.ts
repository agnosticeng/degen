import { sveltekit } from '@sveltejs/kit/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()],

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
