<script>
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n.svelte';
	import { counters, PERIODS } from '$lib/counter.svelte';

	let { id } = $props();

	const isNew = $derived(id === 'new');
	const existing = $derived(isNew ? null : counters.items.find((c) => c.id === id));

	// Seed the editable fields once from the counter being edited. The route
	// remounts this component per id (via {#key}), so a snapshot is correct.
	const seed = untrack(() => existing);
	let name = $state(seed?.name ?? '');
	let goal = $state(seed?.goal ?? 10);
	let period = $state(/** @type {import('$lib/counter.svelte').Period} */ (seed?.period ?? 'hour'));
	let remind = $state(seed?.remind ?? true);

	function back() {
		goto(resolve('/'));
	}

	function save() {
		const trimmed = name.trim();
		const g = Number(goal);
		if (!trimmed || !Number.isFinite(g)) return;
		if (isNew) {
			counters.add(trimmed, g, period, remind);
		} else if (existing) {
			counters.update(existing.id, { name: trimmed, goal: g, period, remind });
		}
		back();
	}

	function remove() {
		if (existing) counters.remove(existing.id);
		back();
	}

	const fieldClass =
		'rounded-lg border border-surface-2 bg-surface px-3 py-[0.6rem] text-base text-text focus:border-accent focus:outline-none';
</script>

<main class="mx-auto min-h-dvh max-w-[26rem] p-6">
	<header class="mb-6 flex items-center gap-4">
		<a class="font-semibold text-accent no-underline hover:underline" href={resolve('/')}>{t('editor.back')}</a>
		<h1 class="text-[1.4rem] font-semibold">{isNew ? t('editor.titleNew') : t('editor.titleEdit')}</h1>
	</header>

	{#if !isNew && !existing}
		<p class="text-dim">{t('editor.notFound')}</p>
	{:else}
		<form
			class="flex flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label class="flex flex-col gap-[0.35rem] text-[0.9rem] text-muted">
				{t('editor.name')}
				<input class={fieldClass} type="text" placeholder={t('editor.namePlaceholder')} bind:value={name} />
			</label>
			<label class="flex flex-col gap-[0.35rem] text-[0.9rem] text-muted">
				{t('editor.goal')}
				<input class={fieldClass} type="number" step="1" placeholder={t('editor.goalPlaceholder')} bind:value={goal} />
				<small class="text-[0.78rem] text-faint">{t('editor.goalHelp')}</small>
			</label>
			<label class="flex flex-col gap-[0.35rem] text-[0.9rem] text-muted">
				{t('editor.resets')}
				<select class={fieldClass} bind:value={period}>
					{#each PERIODS as p (p)}
						<option value={p}>{t(`period.${p}`)}</option>
					{/each}
				</select>
			</label>

			<label class="flex items-center gap-2 text-[0.9rem] text-muted">
				<input type="checkbox" class="size-4 accent-accent" bind:checked={remind} />
				{t('editor.remind')}
			</label>

			<div class="mt-1 flex items-center gap-2">
				{#if !isNew}
					<button
						class="cursor-pointer rounded-lg border border-danger-border bg-transparent px-4 py-[0.55rem] text-[0.95rem] text-danger hover:border-danger hover:bg-danger-bg-hover"
						type="button"
						onclick={remove}>{t('editor.delete')}</button
					>
				{/if}
				<span class="flex-1"></span>
				<button
					class="cursor-pointer rounded-lg border border-surface-3 bg-transparent px-4 py-[0.55rem] text-[0.95rem] text-muted hover:border-dim hover:text-text"
					type="button"
					onclick={back}>{t('editor.cancel')}</button
				>
				<button
					class="cursor-pointer rounded-lg bg-accent px-4 py-[0.55rem] text-[0.95rem] font-bold text-bg hover:bg-accent-hover"
					type="submit">{t('editor.save')}</button
				>
			</div>
		</form>
	{/if}
</main>
