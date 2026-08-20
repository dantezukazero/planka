/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

export const CALENDAR_VIEW_PREFERENCE_KEY_PREFIX = 'planka:calendar-view:';

export const CalendarViews = Object.freeze({
  MONTH: 'dayGridMonth',
  WEEK: 'timeGridWeek',
  AGENDA: 'listMonth',
});

export const CALENDAR_VIEW_ORDER = Object.freeze([
  CalendarViews.MONTH,
  CalendarViews.WEEK,
  CalendarViews.AGENDA,
]);

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const getPreferenceKey = (userId) => `${CALENDAR_VIEW_PREFERENCE_KEY_PREFIX}${userId}`;

export const normalizeCalendarView = (view) =>
  CALENDAR_VIEW_ORDER.includes(view) ? view : CalendarViews.MONTH;

export const loadCalendarView = (userId, storage = getStorage()) => {
  if (!userId || !storage) {
    return CalendarViews.MONTH;
  }

  try {
    return normalizeCalendarView(storage.getItem(getPreferenceKey(userId)));
  } catch {
    return CalendarViews.MONTH;
  }
};

export const saveCalendarView = (userId, view, storage = getStorage()) => {
  const normalizedView = normalizeCalendarView(view);

  if (!userId || !storage) {
    return normalizedView;
  }

  try {
    storage.setItem(getPreferenceKey(userId), normalizedView);
  } catch {
    // Calendar navigation stays usable when browser storage is unavailable.
  }

  return normalizedView;
};

export const navigateCalendar = (calendarApi, direction) => {
  if (!calendarApi || !['prev', 'today', 'next'].includes(direction)) {
    return false;
  }

  calendarApi[direction]();
  return true;
};

export const changeCalendarView = (calendarApi, view) => {
  if (!calendarApi || !CALENDAR_VIEW_ORDER.includes(view)) {
    return false;
  }

  calendarApi.changeView(view);
  return true;
};

export const goToCalendarMonth = (calendarApi, year, month) => {
  if (
    !calendarApi ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 0 ||
    month > 11
  ) {
    return false;
  }

  calendarApi.gotoDate(new Date(year, month, 1));
  return true;
};
