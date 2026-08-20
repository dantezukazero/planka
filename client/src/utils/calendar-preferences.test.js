/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import {
  CalendarViews,
  changeCalendarView,
  goToCalendarMonth,
  loadCalendarView,
  navigateCalendar,
  saveCalendarView,
} from './calendar-preferences';

const USER_ID = 'user-1';

const createStorage = (initialValue = null) => {
  let value = initialValue;

  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn((_, nextValue) => {
      value = nextValue;
    }),
  };
};

describe('calendar preferences and navigation', () => {
  test('defaults an absent or invalid calendar view to month', () => {
    expect(loadCalendarView(USER_ID, createStorage())).toBe(CalendarViews.MONTH);
    expect(loadCalendarView(USER_ID, createStorage('resourceTimelineWeek'))).toBe(
      CalendarViews.MONTH,
    );
  });

  test.each([CalendarViews.MONTH, CalendarViews.WEEK, CalendarViews.AGENDA])(
    'persists and restores %s',
    (view) => {
      const storage = createStorage();

      saveCalendarView(USER_ID, view, storage);

      expect(loadCalendarView(USER_ID, storage)).toBe(view);
    },
  );

  test.each(['prev', 'next', 'today'])('delegates %s navigation to FullCalendar', (direction) => {
    const calendarApi = {
      prev: jest.fn(),
      next: jest.fn(),
      today: jest.fn(),
    };

    expect(navigateCalendar(calendarApi, direction)).toBe(true);
    expect(calendarApi[direction]).toHaveBeenCalledTimes(1);
  });

  test('changes Month to Week, Week to Agenda, and Agenda to Month without replacing events', () => {
    const events = [{ id: 'card-1' }];
    const calendarApi = { changeView: jest.fn() };

    [CalendarViews.WEEK, CalendarViews.AGENDA, CalendarViews.MONTH].forEach((view) => {
      expect(changeCalendarView(calendarApi, view)).toBe(true);
    });

    expect(calendarApi.changeView.mock.calls).toEqual([
      [CalendarViews.WEEK],
      [CalendarViews.AGENDA],
      [CalendarViews.MONTH],
    ]);
    expect(events).toEqual([{ id: 'card-1' }]);
  });

  test('selects a local month and year', () => {
    const calendarApi = { gotoDate: jest.fn() };

    expect(goToCalendarMonth(calendarApi, 2026, 7)).toBe(true);

    const [selectedDate] = calendarApi.gotoDate.mock.calls[0];
    expect(selectedDate.getFullYear()).toBe(2026);
    expect(selectedDate.getMonth()).toBe(7);
    expect(selectedDate.getDate()).toBe(1);
  });

  test('rejects invalid navigation and month input', () => {
    expect(navigateCalendar({}, 'tomorrow')).toBe(false);
    expect(changeCalendarView({}, 'resourceTimelineWeek')).toBe(false);
    expect(goToCalendarMonth({}, 2026, 12)).toBe(false);
  });
});
