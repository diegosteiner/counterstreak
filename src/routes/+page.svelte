<script>
	import { counters, PERIOD_LABELS, goalReached, goalProgress } from '$lib/counter.svelte';
</script>

<svelte:head>
	<title>Counters</title>
</svelte:head>

<main>
	<header>
		<h1>Counters</h1>
		<a class="add-btn" href="/edit/new">+ Add</a>
	</header>

	{#if counters.items.length === 0}
		<div class="empty">
			<p>No counters yet.</p>
			<a class="add-link" href="/edit/new">Add one</a>
		</div>
	{:else}
		<ul class="list">
			{#each counters.items as item (item.id)}
				{@const countDown = item.goal < 0}
				<li class="card" class:reached={goalReached(item.count, item.goal)}>
					<div class="card-head">
						<span class="name">{item.name}</span>
						<span class="streak" class:active={item.streak > 0} title="{item.streak} period streak">
							🔥 {item.streak}
						</span>
						<a class="edit" href="/edit/{item.id}" aria-label="Edit {item.name}">Edit</a>
					</div>
					<output class="count">{item.count}</output>
					<div class="target">
						{#if countDown}{item.count} → 0{:else}{item.count} / {item.goal}{/if}
					</div>
					<div class="period">Resets {PERIOD_LABELS[item.period].toLowerCase()}</div>
					<div
						class="bar"
						role="progressbar"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={Math.round(goalProgress(item.count, item.goal) * 100)}
					>
						<div class="bar-fill" style="width: {goalProgress(item.count, item.goal) * 100}%"></div>
					</div>
					<div class="controls">
						<button
							class="circle"
							class:primary={countDown}
							class:secondary={!countDown}
							onclick={() => counters.decrement(item.id)}
							aria-label="Decrement {item.name}"
						>
							−
						</button>
						<button
							class="circle"
							class:primary={!countDown}
							class:secondary={countDown}
							onclick={() => counters.increment(item.id)}
							aria-label="Increment {item.name}"
						>
							+
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		background: #0f172a;
		color: #f8fafc;
	}

	main {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		box-sizing: border-box;
		text-align: center;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		width: 100%;
		max-width: 30rem;
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.add-btn {
		background: #38bdf8;
		color: #0f172a;
		border: none;
		border-radius: 0.5rem;
		padding: 0.45rem 0.9rem;
		font-size: 0.95rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
	}

	.add-btn:hover {
		background: #7dd3fc;
	}

	.empty {
		margin-top: 3rem;
		color: #94a3b8;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.add-link {
		color: #38bdf8;
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
	}

	.add-link:hover {
		text-decoration: underline;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		max-width: 30rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.card {
		background: #1e293b;
		border: 2px solid transparent;
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	.card.reached {
		border-color: #34d399;
		background: #14342b;
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.5rem;
	}

	.name {
		font-size: 1.1rem;
		font-weight: 600;
		flex: 1;
		text-align: left;
	}

	.streak {
		font-size: 0.9rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: #64748b;
		filter: grayscale(1);
		opacity: 0.6;
	}

	.streak.active {
		color: #fb923c;
		filter: none;
		opacity: 1;
	}

	.edit {
		background: transparent;
		border: 1px solid #475569;
		color: #cbd5e1;
		border-radius: 0.5rem;
		padding: 0.3rem 0.6rem;
		font-size: 0.8rem;
		text-decoration: none;
		cursor: pointer;
	}

	.edit:hover {
		border-color: #94a3b8;
		color: #f8fafc;
	}

	.count {
		font-size: clamp(3rem, 18vw, 5rem);
		font-weight: 800;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.target {
		color: #94a3b8;
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
	}

	.card.reached .target {
		color: #34d399;
	}

	.period {
		color: #64748b;
		font-size: 0.8rem;
		text-transform: capitalize;
	}

	.bar {
		width: 100%;
		height: 0.5rem;
		background: #334155;
		border-radius: 999px;
		overflow: hidden;
		margin: 0.25rem 0 0.75rem;
	}

	.bar-fill {
		height: 100%;
		background: #38bdf8;
		border-radius: 999px;
		transition: width 0.2s ease;
	}

	.card.reached .bar-fill {
		background: #34d399;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.circle {
		border-radius: 50%;
		border: none;
		font-weight: 700;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: transform 0.08s ease, background 0.15s ease;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.circle:active {
		transform: scale(0.92);
	}

	/* The button that moves toward the goal is emphasized as the main action. */
	.circle.primary {
		width: 4rem;
		height: 4rem;
		font-size: 2rem;
		color: #0f172a;
		background: #38bdf8;
	}

	.circle.primary:hover {
		background: #7dd3fc;
	}

	.circle.secondary {
		width: 3.25rem;
		height: 3.25rem;
		font-size: 1.6rem;
		color: #cbd5e1;
		background: #334155;
	}

	.circle.secondary:hover {
		background: #475569;
	}
</style>
