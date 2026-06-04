<script>
	import {
		counters,
		PERIOD_LABELS,
		goalReached,
		goalProgress,
		nextBucket,
		formatDuration
	} from '$lib/counter.svelte';
</script>

<svelte:head>
	<title>Counters</title>
</svelte:head>

<main class="counters">
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

					{#if item.lostStreak > 0}
						<button class="restore" onclick={() => counters.restoreStreak(item.id)}>
							Restore streak 🔥 {item.lostStreak}
						</button>
					{/if}

					<output class="count">{item.count}</output>
					<div class="target">
						{#if countDown}{item.count} → 0{:else}{item.count} / {item.goal}{/if}
					</div>
					<div class="period">
						{PERIOD_LABELS[item.period]} · resets in
						{formatDuration(nextBucket(item.period, item.bucket) - counters.now)}
					</div>
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
