import adapter from '@sveltejs/adapter-static';
import type { Config } from '@sveltejs/kit';

const config: Config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Fully static build so the app can be precached and served offline.
		adapter: adapter({
			fallback: 'index.html'
		})
	}
};

export default config;
