<script>
    import { resolve } from "$app/paths";
    import { t } from "$lib/i18n.svelte";
    import {
        counters,
        goalReached,
        goalProgress,
        reminderDue,
        nextBucket,
        formatDuration,
    } from "$lib/counter.svelte";

    /** @type {{ item: import('$lib/counter.svelte').CounterItem }} */
    let { item } = $props();
    const countDown = $derived(item.goal < 0);
    const reached = $derived(goalReached(item.count, item.goal));
    const progress = $derived(goalProgress(item.count, item.goal));
    // Goal still unmet past the reminder threshold → flag the card as overdue.
    const overdue = $derived(reminderDue(item, counters.now));
</script>

<li>
    <div
        class="flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-colors duration-200 {reached
            ? 'border-success bg-success-bg'
            : overdue
              ? 'border-warn bg-warn-bg'
              : 'border-transparent bg-surface'}"
    >
        <div class="flex w-full items-center justify-between gap-2">
            <a
                class="flex-1 text-left text-xl py-2 font-semibold"
                href={resolve("/edit/[id]", { id: item.id })}
                aria-label={t("card.editAria", { name: item.name })}
            >
                {item.name}
            </a>
            {#if item.lostStreak > 0}
                <button
                    class="cursor-pointer self-stretch rounded-lg border border-warn-border bg-warn-bg px-3 py-2 text-[0.85rem] font-semibold text-warn-text hover:border-warn hover:bg-warn-bg-hover"
                    onclick={() => counters.restoreStreak(item.id)}
                >
                    {t("card.restore")} 🔥 {item.lostStreak}
                </button>
            {:else}
                <span
                    class="text-[0.9rem] font-bold tabular-nums {item.streak > 0
                        ? 'text-streak opacity-100 grayscale-0'
                        : 'text-faint opacity-60 grayscale'}"
                    title={t("card.streakTitle", { count: item.streak })}
                >
                    🔥 {item.streak}
                </span>
            {/if}
        </div>

        <div class="flex w-full items-center gap-4">
            <button
                class="grid size-14 cursor-pointer select-none place-items-center rounded-full text-[1.75rem] font-bold transition active:scale-[0.92] {countDown
                    ? 'order-1 bg-accent text-bg hover:bg-accent-hover'
                    : 'bg-surface-2 text-muted hover:bg-surface-3'}"
                onclick={() => counters.decrement(item.id)}
                aria-label={t("card.decrementAria", { name: item.name })}
            >
                −
            </button>
            <div
                class="flex min-w-0 flex-1 items-baseline justify-center gap-[0.4rem]"
            >
                <output
                    class="text-[clamp(2.25rem,12vw,3.5rem)] font-extrabold leading-none tabular-nums"
                    >{item.count}</output
                >
                <span
                    class="text-[0.95rem] tabular-nums {reached
                        ? 'text-success'
                        : overdue
                          ? 'text-warn-text'
                          : 'text-dim'}"
                    >{#if countDown}→ 0{:else}/ {item.goal}{/if}</span
                >
            </div>
            <button
                class="grid size-14 cursor-pointer select-none place-items-center rounded-full text-[1.75rem] font-bold transition active:scale-[0.92] {countDown
                    ? '-order-1 bg-surface-2 text-muted hover:bg-surface-3'
                    : 'bg-accent text-bg hover:bg-accent-hover'}"
                onclick={() => counters.increment(item.id)}
                aria-label={t("card.incrementAria", { name: item.name })}
            >
                +
            </button>
        </div>
        <div
            class="h-2 w-full overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress * 100)}
        >
            <div
                class="h-full rounded-full transition-[width] duration-200 {reached
                    ? 'bg-success'
                    : overdue
                      ? 'bg-warn'
                      : 'bg-accent'}"
                style="width: {progress * 100}%"
            ></div>
        </div>
        <div class="text-[0.8rem] tabular-nums text-faint">
            {t(`period.${item.period}`)} ·
            {t("card.resetsIn", {
                duration: formatDuration(
                    nextBucket(item.period, item.bucket) - counters.now,
                ),
            })}
        </div>
    </div>
</li>
