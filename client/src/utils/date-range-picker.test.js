import { getDateRangeDayClassName, getDateRangePickerSelection } from './date-range-picker';

describe('date range picker', () => {
  test('selects From and automatically switches to Until without losing times', () => {
    const selection = getDateRangePickerSelection({
      activeField: 'start',
      date: new Date(2026, 7, 21),
      startDate: new Date(2026, 7, 20, 9, 30),
      dueDate: new Date(2026, 7, 23, 17, 45),
    });

    expect(selection.activeField).toBe('due');
    expect([
      selection.startDate.getDate(),
      selection.startDate.getHours(),
      selection.startDate.getMinutes(),
    ]).toEqual([21, 9, 30]);
    expect([
      selection.dueDate.getDate(),
      selection.dueDate.getHours(),
      selection.dueDate.getMinutes(),
    ]).toEqual([23, 17, 45]);
  });

  test('moves Until to From when a new From value would reverse the range', () => {
    const selection = getDateRangePickerSelection({
      activeField: 'start',
      date: new Date(2026, 7, 25),
      startDate: new Date(2026, 7, 20, 14, 30),
      dueDate: new Date(2026, 7, 23, 9, 0),
    });

    expect(selection.startDate).toEqual(new Date(2026, 7, 25, 14, 30));
    expect(selection.dueDate).toEqual(selection.startDate);
  });

  test('does not allow an Until click before From', () => {
    const startDate = new Date(2026, 7, 23, 10, 15);
    const selection = getDateRangePickerSelection({
      activeField: 'due',
      date: new Date(2026, 7, 21),
      startDate,
      dueDate: new Date(2026, 7, 24, 18, 0),
    });

    expect(selection.dueDate).toEqual(startDate);
  });

  test('uses the next picker click as Until while preserving its time', () => {
    const selection = getDateRangePickerSelection({
      activeField: 'due',
      date: new Date(2026, 7, 22),
      startDate: new Date(2026, 7, 21, 9, 0),
      dueDate: new Date(2026, 7, 24, 17, 45),
    });

    expect(selection.dueDate).toEqual(new Date(2026, 7, 22, 17, 45));
    expect(selection.activeField).toBe('due');
  });

  test('marks a same-day range as both From and Until', () => {
    const startDate = new Date(2026, 7, 21, 9, 0);
    const dueDate = new Date(2026, 7, 21, 17, 0);

    expect(getDateRangeDayClassName(new Date(2026, 7, 21), startDate, dueDate)).toBe(
      'calendar-date-range-start calendar-date-range-end',
    );
  });

  test('visibly identifies From, Until, and the days inside a multi-day range', () => {
    const startDate = new Date(2026, 7, 20, 9, 0);
    const dueDate = new Date(2026, 7, 23, 17, 0);

    expect(getDateRangeDayClassName(new Date(2026, 7, 20), startDate, dueDate)).toBe(
      'calendar-date-range-start',
    );
    expect(getDateRangeDayClassName(new Date(2026, 7, 21), startDate, dueDate)).toBe(
      'calendar-date-range-middle',
    );
    expect(getDateRangeDayClassName(new Date(2026, 7, 23), startDate, dueDate)).toBe(
      'calendar-date-range-end',
    );
  });

  test('does not mark an invalid range', () => {
    expect(
      getDateRangeDayClassName(new Date(2026, 7, 22), new Date(2026, 7, 23), new Date(2026, 7, 21)),
    ).toBe('');
  });
});
