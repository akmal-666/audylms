import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['tests/unit/**/*.test.ts'],
		globals: true,
		environment: 'node',
		alias: {
			$lib: new URL('./src/lib', import.meta.url).pathname,
			'$env/static/public': new URL('./tests/__mocks__/env.public.ts', import.meta.url).pathname,
			'$env/static/private': new URL('./tests/__mocks__/env.private.ts', import.meta.url).pathname,
			'$app/navigation': new URL('./tests/__mocks__/app.navigation.ts', import.meta.url).pathname,
			'$app/forms': new URL('./tests/__mocks__/app.forms.ts', import.meta.url).pathname,
			'$app/stores': new URL('./tests/__mocks__/app.stores.ts', import.meta.url).pathname
		}
	}
});
