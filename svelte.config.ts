import adapter from '@sveltejs/adapter-static';
import type { Config } from '@sveltejs/kit';

const config: Config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Fully static build so the app can be precached and served offline.
		// 404.html is the SPA fallback GitHub Pages serves for unknown deep links.
		adapter: adapter({
			fallback: '404.html'
		}),
		serviceWorker: {
			register: false
		},
		// GitHub project pages serve from /<repo>; the deploy workflow sets BASE_PATH.
		paths: {
			base: (process.env.BASE_PATH ?? '') as '' | `/${string}`
		}
	}
};

export default config;
