/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const getCalendarDayNumber = (date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (24 * 60 * 60 * 1000);

const moveToCalendarDay = (date, calendarDay) => {
  const value = isValidDate(date) ? new Date(date) : new Date(calendarDay);
  value.setFullYear(calendarDay.getFullYear(), calendarDay.getMonth(), calendarDay.getDate());
  return value;
};

export const getDateRangePickerSelection = ({ activeField, date, startDate, dueDate }) => {
  if (!isValidDate(date)) {
    return null;
  }

  if (activeField === 'start') {
    const nextStartDate = moveToCalendarDay(startDate, date);
    const nextDueDate =
      isValidDate(dueDate) && dueDate.getTime() >= nextStartDate.getTime()
        ? dueDate
        : new Date(nextStartDate);

    return {
      startDate: nextStartDate,
      dueDate: nextDueDate,
      activeField: 'due',
    };
  }

  let nextDueDate = moveToCalendarDay(dueDate, date);
  if (isValidDate(startDate) && nextDueDate.getTime() < startDate.getTime()) {
    nextDueDate = new Date(startDate);
  }

  return {
    startDate: isValidDate(startDate) ? startDate : null,
    dueDate: nextDueDate,
    activeField: 'due',
  };
};

export const getDateRangeDayClassName = (date, startDate, dueDate) => {
  if (
    !isValidDate(date) ||
    !isValidDate(startDate) ||
    !isValidDate(dueDate) ||
    startDate.getTime() > dueDate.getTime()
  ) {
    return '';
  }

  const day = getCalendarDayNumber(date);
  const startDay = getCalendarDayNumber(startDate);
  const dueDay = getCalendarDayNumber(dueDate);
  const classes = [];

  if (day === startDay) {
    classes.push('calendar-date-range-start');
  }
  if (day === dueDay) {
    classes.push('calendar-date-range-end');
  }
  if (day > startDay && day < dueDay) {
    classes.push('calendar-date-range-middle');
  }

  return classes.join(' ');
};
