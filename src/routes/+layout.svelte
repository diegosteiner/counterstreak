<script>
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { counters } from '$lib/counter.svelte';

	let { children } = $props();

	onMount(() => {
		// Local clock drives both the live "time until reset" display and the
		// period reset/streak reconciliation.
		const tick = () => counters.tick(Date.now());
		const onVisible = () => {
			if (document.visibilityState === 'visible') tick();
		};
		/** @param {MessageEvent} event */
		const onMessage = (event) => {
			if (event.data?.type === 'TIME') counters.tick(event.data.now);
		};

		navigator.serviceWorker?.addEventListener('message', onMessage);
		document.addEventListener('visibilitychange', onVisible);

		tick();
		const interval = setInterval(tick, 1000);

		return () => {
			clearInterval(interval);
			navigator.serviceWorker?.removeEventListener('message', onMessage);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
