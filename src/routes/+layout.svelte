<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import { counters } from '$lib/counter.svelte';

	let { children } = $props();

	/** Ask the service worker for the current time; fall back to the local clock. */
	function checkTime() {
		if (!browser) return;
		const sw = navigator.serviceWorker?.controller;
		if (sw) {
			sw.postMessage({ type: 'GET_TIME' });
		} else {
			// SW not controlling the page yet (first load / dev): use local clock.
			counters.applyNow(Date.now());
		}
	}

	onMount(() => {
		/** @param {MessageEvent} event */
		const onMessage = (event) => {
			if (event.data?.type === 'TIME') counters.applyNow(event.data.now);
		};
		const onVisible = () => {
			if (document.visibilityState === 'visible') checkTime();
		};

		navigator.serviceWorker?.addEventListener('message', onMessage);
		document.addEventListener('visibilitychange', onVisible);

		checkTime();
		// Light heartbeat so resets also fire live while the tab stays open.
		const interval = setInterval(checkTime, 30_000);

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
