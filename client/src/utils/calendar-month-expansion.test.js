import {
  addExpandedMonthWeek,
  getExpandedMonthWeekMinHeight,
  resetExpandedMonthWeeks,
} from './calendar-month-expansion';

describe('calendar month expansion', () => {
  test('grows a week enough for its hidden event rows', () => {
    expect(
      getExpandedMonthWeekMinHeight({
        currentHeight: 144.2,
        eventHeight: 18,
        hiddenEventCount: 5,
      }),
    ).toBe(265);

    expect(
      getExpandedMonthWeekMinHeight({
        currentHeight: 144,
        eventHeight: 24,
        hiddenEventCount: 20,
      }),
    ).toBe(674);
  });

  test('expands only the selected week and never shrinks an existing expansion', () => {
    const collapsedWeeks = new Map();
    const firstExpansion = addExpandedMonthWeek(collapsedWeeks, '2026-08-03', 240);
    const secondExpansion = addExpandedMonthWeek(firstExpansion, '2026-08-17', 310);

    expect(collapsedWeeks).toEqual(new Map());
    expect([...secondExpansion]).toEqual([
      ['2026-08-03', 240],
      ['2026-08-17', 310],
    ]);
    expect(addExpandedMonthWeek(secondExpansion, '2026-08-03', 200)).toBe(secondExpansion);
  });

  test('resets expanded weeks without replacing an already empty state', () => {
    const collapsedWeeks = new Map();

    expect(resetExpandedMonthWeeks(collapsedWeeks)).toBe(collapsedWeeks);
    expect(resetExpandedMonthWeeks(new Map([['2026-08-03', 240]]))).toEqual(new Map());
  });
});
