// adapter-vercel is used on Vercel CI/CD.
// On Windows dev machines without Developer Mode enabled, the Vercel adapter
// fails with EPERM when creating symlinks. The build itself (vite build) still
// succeeds — only the Vercel packaging step is affected.
// To fix locally: enable Developer Mode in Windows Settings → Privacy & Security.
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'nodejs22.x'
		}),
		alias: {
			$lib: 'src/lib'
		}
	}
};

export default config;
