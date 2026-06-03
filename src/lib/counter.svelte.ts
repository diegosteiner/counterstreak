import { browser } from '$app/environment';

const LIST_KEY = 'counters:list';

// Legacy keys (pre multi-counter / pre per-counter period). Migrated on first load.
const LEGACY_COUNT_KEY = 'counter:count';

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
 * @param {number} goal
 * @returns {number}
 */
export function counterStart(goal: number): number {
	return goal < 0 ? -goal : 0;
}

/**
 * Whether the goal has been met: reaching `goal` while counting up, or reaching
 * 0 (or below) while counting down.
 * @param {number} count
 * @param {number} goal
 * @returns {boolean}
 */
export function goalReached(count: number, goal: number): boolean {
	return goal < 0 ? count <= 0 : count >= goal;
}

/**
 * Progress toward the goal as a 0..1 fraction (clamped). Counting up it's
 * `count / goal`; counting down it's how far we've descended from `|goal|` to 0.
 * @param {number} count
 * @param {number} goal
 * @returns {number}
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

/** A single named counter with a target (goal) value and a reset period. */
export interface CounterItem {
	id: string;
	name: string;
	goal: number;
	count: number;
	period: Period;
	/** Identifier of the period this counter currently belongs to; reset when it changes. */
	bucket: number;
	/** Consecutive periods the goal was met. Bumped on a met period, reset to 0 otherwise. */
	streak: number;
}

/**
 * Stable identifier (epoch-ms at the start of the period) for the period that
 * `date` falls in. When this value changes between checks, the counter has
 * rolled over to a new period and resets.
 * @param {Period} period
 * @param {Date} [date]
 * @returns {number}
 */
export function periodBucket(period: Period, date: Date = new Date()): number {
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
 * @param {Period} period
 * @param {number} bucket
 * @returns {number}
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
	// `o.max` is the legacy field name; fall back to it for data persisted before the rename.
	const goal = Number(o.goal ?? o.max);
	const count = Number(o.count);
	const period: Period = isPeriod(o.period) ? o.period : 'hour';
	const storedBucket = Number(o.bucket);
	const streak = Number(o.streak);
	return {
		id,
		name,
		goal: Number.isFinite(goal) && goal !== 0 ? goal : 1,
		count: Number.isFinite(count) ? count : 0,
		period,
		bucket: Number.isFinite(storedBucket) ? storedBucket : periodBucket(period),
		streak: Number.isFinite(streak) && streak >= 0 ? streak : 0
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
			// fall through to migration / empty
		}
	}

	// Migrate a legacy single hourly counter so existing users keep their value.
	const legacy = localStorage.getItem(LEGACY_COUNT_KEY);
	if (legacy !== null) {
		const count = Number(legacy);
		return [
			{
				id: newId(),
				name: 'Counter',
				goal: 10,
				count: Number.isFinite(count) ? count : 0,
				period: 'hour',
				bucket: periodBucket('hour'),
				streak: 0
			}
		];
	}

	return [];
}

/** Reactive collection of counters, persisted to localStorage; each resets on its own period. */
class CounterStore {
	items = $state<CounterItem[]>(load());

	#persist(): void {
		if (!browser) return;
		localStorage.setItem(LIST_KEY, JSON.stringify(this.items));
	}

	#find(id: string): CounterItem | undefined {
		return this.items.find((c) => c.id === id);
	}

	add(name: string, goal: number, period: Period = 'hour'): void {
		const safeName = name.trim() || 'Counter';
		const safeGoal = Number.isFinite(goal) && goal !== 0 ? Math.trunc(goal) : 1;
		const safePeriod: Period = isPeriod(period) ? period : 'hour';
		this.items.push({
			id: newId(),
			name: safeName,
			goal: safeGoal,
			count: counterStart(safeGoal),
			period: safePeriod,
			bucket: periodBucket(safePeriod),
			streak: 0
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
		if (changes.goal !== undefined && Number.isFinite(changes.goal) && changes.goal !== 0) {
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
	 * Called from the layout on open / focus / interval / SW tick.
	 * @param {number} now epoch-ms
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
				item.streak = metGoal && consecutive ? item.streak + 1 : 0;
				item.count = counterStart(item.goal);
				item.bucket = bucket;
				changed = true;
			}
		}
		if (changed) this.#persist();
	}
}

export const counters = new CounterStore();

// On first load (in the browser), reconcile against the real clock immediately —
// the service worker confirms this shortly after, but this avoids a flash of a
// stale count before the SW responds.
if (browser) {
	counters.applyNow(Date.now());
}
