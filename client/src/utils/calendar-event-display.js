/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

export const CALENDAR_VISUAL_DURATION_OPTIONS = Object.freeze({
  forceEventDuration: true,
  defaultTimedEventDuration: '01:00',
});

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

export const getCalendarEventTimeText = (event, fullCalendarTimeText, language) => {
  if (!event || event.extendedProps.isDateRange || !isValidDate(event.start) || !language) {
    return fullCalendarTimeText;
  }

  return new Intl.DateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(event.start);
};
