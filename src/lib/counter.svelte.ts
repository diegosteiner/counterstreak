import { browser } from '$app/environment';

const LIST_KEY = 'counters:list';

/** How often a counter resets to 0. */
export type Period = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export const PERIODS: Period[] = ['minute', 'hour', 'day', 'week', 'month', 'year'];

export const PERIOD_LABELS: Record<Period, string> = {
	minute: 'Every minute',
	hour: 'Hourly',
	day: 'Daily',
	week: 'Weekly',
	month: 'Monthly',
	year: 'Yearly'
};

/**
 * Where a counter sits at the start of each period: 0 for a positive (count-up)
 * goal, or `|goal|` for a negative (count-down) goal.
 */
function counterStart(goal: number): number {
	return goal < 0 ? -goal : 0;
}

/**
 * Whether the goal has been met: reaching `goal` while counting up, or reaching
 * 0 (or below) while counting down. A goal of 0 is always met (count-up).
 */
export function goalReached(count: number, goal: number): boolean {
	if (goal === 0) return true;
	return goal < 0 ? count <= 0 : count >= goal;
}

/**
 * Progress toward the goal as a 0..1 fraction (clamped). Counting up it's
 * `count / goal`; counting down it's how far we've descended from `|goal|` to 0.
 */
export function goalProgress(count: number, goal: number): number {
	let frac: number;
	if (goal < 0) {
		const start = -goal;
		frac = start === 0 ? 1 : (start - count) / start;
	} else {
		frac = goal === 0 ? 1 : count / goal;
	}
	return Math.max(0, Math.min(1, frac));
}

/**
 * Human-friendly "time left" string for a millisecond duration, e.g. `42s`,
 * `12m`, `3h 20m`, `2d 4h`. Returns `now` at or past zero.
 */
export function formatDuration(ms: number): string {
	if (ms <= 0) return 'now';
	const totalSec = Math.floor(ms / 1000);
	if (totalSec < 60) return `${totalSec}s`;
	const totalMin = Math.floor(totalSec / 60);
	if (totalMin < 60) return `${totalMin}m`;
	const totalHr = Math.floor(totalMin / 60);
	if (totalHr < 24) return `${totalHr}h ${totalMin % 60}m`;
	const days = Math.floor(totalHr / 24);
	return `${days}d ${totalHr % 24}h`;
}

/** A single named counter with a target (goal) value and a reset period. */
interface CounterItem {
	id: string;
	name: string;
	goal: number;
	count: number;
	period: Period;
	/** Identifier of the period this counter currently belongs to; reset when it changes. */
	bucket: number;
	/** Consecutive periods the goal was met. Bumped on a met period, reset to 0 otherwise. */
	streak: number;
	/**
	 * Streak value broken at the most recent reset, recoverable only during the
	 * current period (a "streak freeze" for when the user forgot to act in time).
	 * 0 when there is nothing to restore.
	 */
	lostStreak: number;
}

/**
 * Stable identifier (epoch-ms at the start of the period) for the period that
 * `date` falls in. When this value changes between checks, the counter has
 * rolled over to a new period and resets.
 */
function periodBucket(period: Period, date: Date = new Date()): number {
	const d = new Date(date.getTime());
	switch (period) {
		case 'minute':
			d.setSeconds(0, 0);
			return d.getTime();
		case 'hour':
			d.setMinutes(0, 0, 0);
			return d.getTime();
		case 'day':
			d.setHours(0, 0, 0, 0);
			return d.getTime();
		case 'week': {
			d.setHours(0, 0, 0, 0);
			// Roll back to Monday (getDay: 0=Sun..6=Sat).
			const diff = (d.getDay() + 6) % 7;
			d.setDate(d.getDate() - diff);
			return d.getTime();
		}
		case 'month':
			d.setHours(0, 0, 0, 0);
			d.setDate(1);
			return d.getTime();
		case 'year':
			d.setHours(0, 0, 0, 0);
			d.setMonth(0, 1);
			return d.getTime();
	}
}

/**
 * Bucket of the period immediately following the one identified by `bucket`.
 * Used to tell whether a reset crossed exactly one period (streak continues) or
 * skipped one or more empty periods (streak broken).
 */
export function nextBucket(period: Period, bucket: number): number {
	const d = new Date(bucket);
	switch (period) {
		case 'minute':
			d.setMinutes(d.getMinutes() + 1);
			break;
		case 'hour':
			d.setHours(d.getHours() + 1);
			break;
		case 'day':
			d.setDate(d.getDate() + 1);
			break;
		case 'week':
			d.setDate(d.getDate() + 7);
			break;
		case 'month':
			d.setMonth(d.getMonth() + 1);
			break;
		case 'year':
			d.setFullYear(d.getFullYear() + 1);
			break;
	}
	return periodBucket(period, d);
}

function newId(): string {
	if (browser && typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `c-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function isPeriod(v: unknown): v is Period {
	return typeof v === 'string' && (PERIODS as string[]).includes(v);
}

function sanitize(raw: unknown): CounterItem | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	const id = typeof o.id === 'string' ? o.id : newId();
	const name = typeof o.name === 'string' ? o.name : '';
	const goal = Number(o.goal);
	const count = Number(o.count);
	const period: Period = isPeriod(o.period) ? o.period : 'hour';
	const storedBucket = Number(o.bucket);
	const streak = Number(o.streak);
	const lostStreak = Number(o.lostStreak);
	return {
		id,
		name,
		goal: Number.isFinite(goal) ? goal : 1,
		count: Number.isFinite(count) ? count : 0,
		period,
		bucket: Number.isFinite(storedBucket) ? storedBucket : periodBucket(period),
		streak: Number.isFinite(streak) && streak >= 0 ? streak : 0,
		lostStreak: Number.isFinite(lostStreak) && lostStreak >= 0 ? lostStreak : 0
	};
}

function load(): CounterItem[] {
	if (!browser) return [];

	const rawList = localStorage.getItem(LIST_KEY);
	if (rawList) {
		try {
			const parsed = JSON.parse(rawList);
			if (Array.isArray(parsed)) {
				return parsed.map(sanitize).filter((c): c is CounterItem => c !== null);
			}
		} catch {
			// fall through to empty
		}
	}

	return [];
}

/** Reactive collection of counters, persisted to localStorage; each resets on its own period. */
class CounterStore {
	items = $state<CounterItem[]>(load());
	/** Reactive wall-clock, ticked by the layout, so "time until reset" stays live. */
	now = $state(browser ? Date.now() : 0);

	#persist(): void {
		if (!browser) return;
		localStorage.setItem(LIST_KEY, JSON.stringify(this.items));
	}

	#find(id: string): CounterItem | undefined {
		return this.items.find((c) => c.id === id);
	}

	add(name: string, goal: number, period: Period = 'hour'): void {
		const safeName = name.trim() || 'Counter';
		const safeGoal = Number.isFinite(goal) ? Math.trunc(goal) : 1;
		const safePeriod: Period = isPeriod(period) ? period : 'hour';
		this.items.push({
			id: newId(),
			name: safeName,
			goal: safeGoal,
			count: counterStart(safeGoal),
			period: safePeriod,
			bucket: periodBucket(safePeriod),
			streak: 0,
			lostStreak: 0
		});
		this.#persist();
	}

	remove(id: string): void {
		this.items = this.items.filter((c) => c.id !== id);
		this.#persist();
	}

	update(id: string, changes: { name?: string; goal?: number; period?: Period }): void {
		const item = this.#find(id);
		if (!item) return;
		if (changes.name !== undefined) item.name = changes.name.trim() || 'Counter';
		if (changes.goal !== undefined && Number.isFinite(changes.goal)) {
			const newGoal = Math.trunc(changes.goal);
			// Switching between count-up and count-down re-seeds the count to the new start.
			if (newGoal < 0 !== item.goal < 0) item.count = counterStart(newGoal);
			item.goal = newGoal;
		}
		if (changes.period !== undefined && isPeriod(changes.period) && changes.period !== item.period) {
			item.period = changes.period;
			// Re-anchor to the new period so it doesn't reset spuriously on the next check.
			item.bucket = periodBucket(changes.period);
		}
		this.#persist();
	}

	increment(id: string): void {
		const item = this.#find(id);
		if (!item) return;
		item.count += 1;
		this.#persist();
	}

	decrement(id: string): void {
		const item = this.#find(id);
		if (!item) return;
		item.count -= 1;
		this.#persist();
	}

	/**
	 * Reconcile every counter against the current time. When a counter's period
	 * has rolled over, advance or break its streak based on whether the goal was
	 * met in the period that just ended, then reset the count for the new period.
	 * `now` is epoch-ms; called from the layout on open / focus / interval.
	 */
	applyNow(now: number): void {
		if (!Number.isFinite(now)) return;
		const date = new Date(now);
		let changed = false;
		for (const item of this.items) {
			const bucket = periodBucket(item.period, date);
			if (bucket !== item.bucket) {
				// Goal met in the just-ended period AND the next period followed it
				// directly (no empty periods skipped) → streak continues; else broken.
				const metGoal = goalReached(item.count, item.goal);
				const consecutive = bucket === nextBucket(item.period, item.bucket);
				if (metGoal && consecutive) {
					item.streak += 1;
					item.lostStreak = 0;
				} else {
					// Remember the broken streak so it can be restored this coming period.
					// (If it was already 0, any earlier recovery chance now expires.)
					item.lostStreak = item.streak;
					item.streak = 0;
				}
				item.count = counterStart(item.goal);
				item.bucket = bucket;
				changed = true;
			}
		}
		if (changed) this.#persist();
	}

	/** Advance the reactive clock and reconcile resets in one step. */
	tick(now: number): void {
		if (!Number.isFinite(now)) return;
		this.now = now;
		this.applyNow(now);
	}

	/**
	 * Restore a streak that broke at the most recent reset (the user forgot to act
	 * in time). Only possible while `lostStreak > 0`, i.e. during the period right
	 * after the break.
	 */
	restoreStreak(id: string): void {
		const item = this.#find(id);
		if (!item || item.lostStreak <= 0) return;
		item.streak = item.lostStreak;
		item.lostStreak = 0;
		this.#persist();
	}
}

export const counters = new CounterStore();

// On first load (in the browser), reconcile against the real clock immediately
// so counters never render a stale count from a period that already rolled over.
// The layout's tick loop keeps them current thereafter.
if (browser) {
	counters.applyNow(Date.now());
}
