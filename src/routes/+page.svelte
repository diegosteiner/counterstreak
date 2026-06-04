<script>
    import { base } from "$app/paths";
    import { counters } from "$lib/counter.svelte";
    import CounterCard from "$lib/CounterCard.svelte";
</script>

<svelte:head>
    <title>Counters</title>
</svelte:head>

<main class="counters">
    <header>
        <h1>Counters</h1>
    </header>

    {#if counters.items.length === 0}
        <div class="empty">
            <p>No counters yet.</p>
        </div>
    {:else}
        <ul class="list">
            {#each counters.items as item (item.id)}
                <CounterCard {item} />
            {/each}
        </ul>
    {/if}
    <footer>
        <a class="add-link" href="{base}/edit/new">Add one</a>
    </footer>
</main>
