<script>
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { counters } from '$lib/counter.svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		// Local clock drives both the live "time until reset" display and the
		// period reset/streak reconciliation.
		const tick = () => counters.tick(Date.now());
		const onVisible = () => {
			if (document.visibilityState === 'visible') tick();
		};

		document.addEventListener('visibilitychange', onVisible);

		tick();
		const interval = setInterval(tick, 1000);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
