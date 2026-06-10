<script>
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n.svelte';

	// The deferred `beforeinstallprompt` event, set only when the browser deems
	// the app installable (not already installed, served over HTTPS, etc.).
	/** @type {BeforeInstallPromptEvent | null} */
	let deferred = $state(null);
	let dismissed = $state(false);

	onMount(() => {
		/** @param {BeforeInstallPromptEvent} e */
		const onPrompt = (e) => {
			// Suppress the default mini-infobar so we can show our own prompt.
			e.preventDefault();
			deferred = e;
		};
		const onInstalled = () => {
			deferred = null;
		};
		window.addEventListener('beforeinstallprompt', onPrompt);
		window.addEventListener('appinstalled', onInstalled);
		return () => {
			window.removeEventListener('beforeinstallprompt', onPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	});

	async function install() {
		if (!deferred) return;
		await deferred.prompt();
		await deferred.userChoice;
		// The event can only be used once; the browser re-fires it if still installable.
		deferred = null;
	}
</script>

{#if deferred && !dismissed}
	<div
		class="fixed bottom-4 left-1/2 z-10 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-surface-2 bg-surface px-3 py-[0.6rem] shadow-[0_8px_24px_rgb(0_0_0/0.4)]"
		role="dialog"
		aria-label={t('install.action')}
	>
		<span class="text-[0.9rem] text-muted">{t('install.message')}</span>
		<button
			class="flex-none rounded-lg bg-accent px-[0.8rem] py-[0.4rem] text-[0.9rem] font-bold text-bg hover:bg-accent-hover"
			onclick={install}
		>
			{t('install.action')}
		</button>
		<button
			class="flex-none text-base leading-none text-faint hover:text-text"
			aria-label={t('install.dismiss')}
			onclick={() => (dismissed = true)}
		>
			✕
		</button>
	</div>
{/if}
