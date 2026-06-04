import { describe, it, expect, beforeEach } from 'vitest';
import {
	counters,
	goalReached,
	goalProgress,
	formatDuration,
	nextBucket,
	type Period
} from './counter.svelte';

// Local-midnight epoch for a given day; equals periodBucket('day', d) since that
// zeroes the time-of-day. Used to anchor counters at a known period boundary.
function day(year: number, month: number, date: number, hour = 0): number {
	return new Date(year, month, date, hour).getTime();
}

describe('goalReached', () => {
	it('counts up: met once count reaches the goal', () => {
		expect(goalReached(4, 5)).toBe(false);
		expect(goalReached(5, 5)).toBe(true);
		expect(goalReached(6, 5)).toBe(true);
	});

	it('counts down: met once count reaches 0 or below', () => {
		expect(goalReached(1, -3)).toBe(false);
		expect(goalReached(0, -3)).toBe(true);
		expect(goalReached(-2, -3)).toBe(true);
	});

	it('a goal of 0 is always met', () => {
		expect(goalReached(0, 0)).toBe(true);
		expect(goalReached(-10, 0)).toBe(true);
	});
});

describe('goalProgress', () => {
	it('counts up as count / goal, clamped to 0..1', () => {
		expect(goalProgress(0, 4)).toBe(0);
		expect(goalProgress(2, 4)).toBe(0.5);
		expect(goalProgress(8, 4)).toBe(1);
	});

	it('counts down as descent from |goal| to 0', () => {
		expect(goalProgress(4, -4)).toBe(0); // at the start
		expect(goalProgress(1, -4)).toBe(0.75);
		expect(goalProgress(0, -4)).toBe(1); // reached
		expect(goalProgress(-2, -4)).toBe(1); // overshot, clamped
	});

	it('treats a goal of 0 as complete', () => {
		expect(goalProgress(0, 0)).toBe(1);
	});
});

describe('formatDuration', () => {
	it('returns "now" at or past zero', () => {
		expect(formatDuration(0)).toBe('now');
		expect(formatDuration(-5000)).toBe('now');
	});

	it('formats seconds, minutes, hours, and days', () => {
		expect(formatDuration(42_000)).toBe('42s');
		expect(formatDuration(12 * 60_000)).toBe('12m');
		expect(formatDuration((3 * 60 + 20) * 60_000)).toBe('3h 20m');
		expect(formatDuration((2 * 24 + 4) * 3_600_000)).toBe('2d 4h');
	});
});

describe('nextBucket', () => {
	it('advances by exactly one period', () => {
		const cases: Array<[Period, number, number]> = [
			['minute', new Date(2026, 0, 1, 9, 30).getTime(), new Date(2026, 0, 1, 9, 31).getTime()],
			['hour', new Date(2026, 0, 1, 9).getTime(), new Date(2026, 0, 1, 10).getTime()],
			['day', day(2026, 0, 1), day(2026, 0, 2)],
			['month', day(2026, 0, 1), day(2026, 1, 1)],
			['year', day(2026, 0, 1), day(2027, 0, 1)]
		];
		for (const [period, bucket, expected] of cases) {
			expect(nextBucket(period, bucket)).toBe(expected);
		}
	});

	it('weeks step Monday-to-Monday', () => {
		// 2026-01-05 is a Monday.
		const monday = day(2026, 0, 5);
		expect(nextBucket('week', monday)).toBe(day(2026, 0, 12));
	});
});

describe('CounterStore', () => {
	beforeEach(() => {
		counters.items = [];
	});

	it('add() seeds a count-up counter at 0 and a count-down counter at |goal|', () => {
		counters.add('Up', 5, 'day');
		counters.add('Down', -3, 'day');
		expect(counters.items[0]).toMatchObject({ name: 'Up', goal: 5, count: 0, streak: 0 });
		expect(counters.items[1]).toMatchObject({ name: 'Down', goal: -3, count: 3 });
	});

	it('increment / decrement adjust the count', () => {
		counters.add('C', 5, 'day');
		const { id } = counters.items[0];
		counters.increment(id);
		counters.increment(id);
		counters.decrement(id);
		expect(counters.items[0].count).toBe(1);
	});

	it('update() re-seeds the count when the goal flips sign', () => {
		counters.add('C', 5, 'day');
		const { id } = counters.items[0];
		counters.increment(id); // count = 1
		counters.update(id, { goal: -4 });
		expect(counters.items[0].count).toBe(4); // re-seeded to |goal|
	});

	it('update() re-anchors the bucket when the period changes', () => {
		counters.add('C', 5, 'day');
		const item = counters.items[0];
		item.bucket = 0; // stale
		counters.update(item.id, { period: 'week' });
		expect(counters.items[0].bucket).toBeGreaterThan(0);
	});

	describe('applyNow rollover', () => {
		// A day counter anchored on Jan 1 that met its goal.
		function metCounter() {
			counters.add('C', 5, 'day');
			const item = counters.items[0];
			item.count = 5; // goal reached
			item.streak = 2;
			item.bucket = day(2026, 0, 1);
			return item;
		}

		it('continues the streak when the goal was met and the next period follows directly', () => {
			metCounter();
			counters.applyNow(day(2026, 0, 2, 9));
			expect(counters.items[0]).toMatchObject({
				streak: 3,
				lostStreak: 0,
				count: 0, // reset for the new period
				bucket: day(2026, 0, 2)
			});
		});

		it('breaks the streak when the goal was not met', () => {
			const item = metCounter();
			item.count = 1; // goal NOT reached
			counters.applyNow(day(2026, 0, 2, 9));
			expect(counters.items[0]).toMatchObject({ streak: 0, lostStreak: 2, count: 0 });
		});

		it('breaks the streak when one or more periods were skipped', () => {
			metCounter();
			counters.applyNow(day(2026, 0, 3, 9)); // skipped Jan 2 entirely
			expect(counters.items[0]).toMatchObject({ streak: 0, lostStreak: 2 });
		});

		it('does nothing while still inside the same period', () => {
			metCounter();
			counters.applyNow(day(2026, 0, 1, 23));
			expect(counters.items[0]).toMatchObject({ streak: 2, count: 5, bucket: day(2026, 0, 1) });
		});
	});

	describe('restoreStreak', () => {
		it('restores a streak broken at the last reset, then expires the chance', () => {
			counters.add('C', 5, 'day');
			const item = counters.items[0];
			item.count = 1;
			item.streak = 4;
			item.bucket = day(2026, 0, 1);
			counters.applyNow(day(2026, 0, 2, 9)); // breaks: streak 0, lostStreak 4

			counters.restoreStreak(item.id);
			expect(counters.items[0]).toMatchObject({ streak: 4, lostStreak: 0 });

			// A second restore does nothing once lostStreak is cleared.
			counters.restoreStreak(item.id);
			expect(counters.items[0]).toMatchObject({ streak: 4, lostStreak: 0 });
		});
	});
});
