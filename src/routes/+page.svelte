<script>
	import { resolve } from "$app/paths";
	import { counters } from "$lib/counter.svelte";
	import { t, getLocale, setLocale, SUPPORTED_LOCALES } from "$lib/i18n.svelte";
	import CounterCard from "$lib/CounterCard.svelte";
</script>

<svelte:head>
	<title>{t("app.title")}</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center gap-2 p-6 text-center">
	<header
		class="flex w-full max-w-[30rem] items-center justify-center gap-4"
	></header>

	{#if counters.items.length === 0}
		<div class="mt-12 flex flex-col items-center gap-3 text-dim">
			<p>{t("home.empty")}</p>
		</div>
	{/if}
	<ul class="flex w-full max-w-[30rem] list-none flex-col gap-5">
		{#each counters.items as item (item.id)}
			<CounterCard {item} />
		{/each}
		<li
			class=" rounded-2xl border-2transition-colors border-transparent bg-surface"
		>
			<a
				class="text-muted p-5 flex flex-col items-center"
				href={resolve("/edit/[id]", { id: "new" })}>{t("home.add")}</a
			>
		</li>
	</ul>
	<footer class="mt-auto flex items-center justify-space-around gap-4 pt-4">
		<span class="text-sm text-dim"
			>{t("home.credits")}
			<a class="underline" href="https://openscript.ch">openscript GmbH</a
			></span
		>
		<select
			class="cursor-pointer rounded-lg border border-surface-2 bg-surface px-2 py-[0.3rem] text-[0.85rem] text-muted focus:border-accent focus:outline-none"
			aria-label={t("home.language")}
			value={getLocale()}
			onchange={(e) =>
				setLocale(
					/** @type {import('$lib/i18n.svelte').Locale} */ (
						e.currentTarget.value
					),
				)}
		>
			{#each SUPPORTED_LOCALES as l (l)}
				<option value={l}>{l.toUpperCase()}</option>
			{/each}
		</select>
	</footer>
</main>
