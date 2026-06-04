<script>
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { counters, PERIODS, PERIOD_LABELS } from '$lib/counter.svelte';

	let { id } = $props();

	const isNew = $derived(id === 'new');
	const existing = $derived(isNew ? null : counters.items.find((c) => c.id === id));

	// Seed the editable fields once from the counter being edited. The route
	// remounts this component per id (via {#key}), so a snapshot is correct.
	const seed = untrack(() => existing);
	let name = $state(seed?.name ?? '');
	let goal = $state(seed?.goal ?? 10);
	let period = $state(/** @type {import('$lib/counter.svelte').Period} */ (seed?.period ?? 'hour'));

	function back() {
		goto(`${base}/`);
	}

	function save() {
		const trimmed = name.trim();
		const g = Number(goal);
		if (!trimmed || !Number.isFinite(g)) return;
		if (isNew) {
			counters.add(trimmed, g, period);
		} else if (existing) {
			counters.update(existing.id, { name: trimmed, goal: g, period });
		}
		back();
	}

	function remove() {
		if (existing) counters.remove(existing.id);
		back();
	}
</script>

<main class="editor">
	<header>
		<a class="back" href="{base}/">← Back</a>
		<h1>{isNew ? 'New counter' : 'Edit counter'}</h1>
	</header>

	{#if !isNew && !existing}
		<p class="missing">Counter not found.</p>
	{:else}
		<form
			class="panel"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<label>
				Name
				<input class="field" type="text" placeholder="Counter name" bind:value={name} />
			</label>
			<label>
				Goal
				<input class="field" type="number" step="1" placeholder="Goal" bind:value={goal} />
				<small class="help">Negative counts down from its absolute value to 0.</small>
			</label>
			<label>
				Resets
				<select class="field" bind:value={period}>
					{#each PERIODS as p (p)}
						<option value={p}>{PERIOD_LABELS[p]}</option>
					{/each}
				</select>
			</label>

			<div class="actions">
				{#if !isNew}
					<button class="danger" type="button" onclick={remove}>Delete</button>
				{/if}
				<span class="spacer"></span>
				<button class="ghost" type="button" onclick={back}>Cancel</button>
				<button class="primary" type="submit">Save</button>
			</div>
		</form>
	{/if}
</main>
