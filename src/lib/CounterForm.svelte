<script>
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
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
		goto('/');
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

<main>
	<header>
		<a class="back" href="/">← Back</a>
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

<style>
	main {
		min-height: 100dvh;
		padding: 1.5rem;
		box-sizing: border-box;
		max-width: 26rem;
		margin: 0 auto;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
		font-size: 1.4rem;
		font-weight: 600;
	}

	.back {
		color: #38bdf8;
		text-decoration: none;
		font-weight: 600;
	}

	.back:hover {
		text-decoration: underline;
	}

	.missing {
		color: #94a3b8;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		color: #cbd5e1;
	}

	.field {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		color: #f8fafc;
		padding: 0.6rem 0.75rem;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.field:focus {
		outline: none;
		border-color: #38bdf8;
	}

	.help {
		color: #64748b;
		font-size: 0.78rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.spacer {
		flex: 1;
	}

	.primary {
		background: #38bdf8;
		color: #0f172a;
		border: none;
		border-radius: 0.5rem;
		padding: 0.55rem 1rem;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
	}

	.primary:hover {
		background: #7dd3fc;
	}

	.ghost {
		background: transparent;
		border: 1px solid #475569;
		color: #cbd5e1;
		border-radius: 0.5rem;
		padding: 0.55rem 1rem;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.ghost:hover {
		border-color: #94a3b8;
		color: #f8fafc;
	}

	.danger {
		background: transparent;
		border: 1px solid #7f1d1d;
		color: #f87171;
		border-radius: 0.5rem;
		padding: 0.55rem 1rem;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.danger:hover {
		border-color: #f87171;
		background: #2a1414;
	}
</style>
