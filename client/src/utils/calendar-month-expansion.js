/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

export const CALENDAR_MONTH_WEEK_CLASS = 'calendar-month-week';
export const CALENDAR_MONTH_DAY_CELL_CLASS = 'calendar-month-day-cell';
export const CALENDAR_EXPANDED_WEEK_ATTRIBUTE = 'data-calendar-expanded-week';
export const CALENDAR_EXPANDED_WEEK_MIN_HEIGHT_PROPERTY = '--calendar-expanded-week-min-height';

const MIN_EVENT_HEIGHT = 20;
const EVENT_GAP = 2;
const EXPANSION_PADDING = 10;

export const getExpandedMonthWeekMinHeight = ({ currentHeight, eventHeight, hiddenEventCount }) =>
  Math.ceil(
    Math.max(0, currentHeight) +
      Math.max(0, hiddenEventCount) * (Math.max(MIN_EVENT_HEIGHT, eventHeight) + EVENT_GAP) +
      EXPANSION_PADDING,
  );

export const addExpandedMonthWeek = (expandedWeeks, weekKey, minHeight) => {
  const currentMinHeight = expandedWeeks.get(weekKey);

  if (currentMinHeight !== undefined && currentMinHeight >= minHeight) {
    return expandedWeeks;
  }

  const nextExpandedWeeks = new Map(expandedWeeks);
  nextExpandedWeeks.set(weekKey, minHeight);

  return nextExpandedWeeks;
};

export const resetExpandedMonthWeeks = (expandedWeeks) =>
  expandedWeeks.size === 0 ? expandedWeeks : new Map();
