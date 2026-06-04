<script>
	import { base } from '$app/paths';
	import { counters } from '$lib/counter.svelte';
	import { t, getLocale, setLocale, SUPPORTED_LOCALES } from '$lib/i18n.svelte';
	import CounterCard from '$lib/CounterCard.svelte';
</script>

<svelte:head>
	<title>{t('app.title')}</title>
</svelte:head>

<main class="counters">
	<header>
		<h1>{t('home.heading')}</h1>
	</header>

	{#if counters.items.length === 0}
		<div class="empty">
			<p>{t('home.empty')}</p>
		</div>
	{:else}
		<ul class="list">
			{#each counters.items as item (item.id)}
				<CounterCard {item} />
			{/each}
		</ul>
	{/if}
	<footer>
		<a class="add-link" href="{base}/edit/new">{t('home.addOne')}</a>
		<select
			class="locale"
			aria-label={t('home.language')}
			value={getLocale()}
			onchange={(e) => setLocale(/** @type {import('$lib/i18n.svelte').Locale} */ (e.currentTarget.value))}
		>
			{#each SUPPORTED_LOCALES as l (l)}
				<option value={l}>{l.toUpperCase()}</option>
			{/each}
		</select>
	</footer>
</main>
