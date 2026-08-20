/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

export const applyCalendarEditingPermissions = (events, canEdit) =>
  events.map((event) => ({
    ...event,
    startEditable: canEdit,
    durationEditable: canEdit,
  }));

export const getCalendarEventUpdate = (event) => {
  if (!event || !isValidDate(event.start)) {
    return null;
  }

  if (!event.extendedProps.isDateRange) {
    return {
      dueDate: event.start,
    };
  }

  if (!isValidDate(event.end) || event.start.getTime() > event.end.getTime()) {
    return null;
  }

  return {
    startDate: event.start,
    dueDate: event.end,
  };
};

const getLocalDayNumber = (date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (24 * 60 * 60 * 1000);

const shiftByLocalDays = (date, days) => {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + days);
  return shiftedDate;
};

export const getCalendarEventDropUpdate = (event, oldEvent) => {
  if (!event || !oldEvent || !event.allDay || oldEvent.allDay) {
    return getCalendarEventUpdate(event);
  }

  if (!isValidDate(event.start) || !isValidDate(oldEvent.start)) {
    return null;
  }

  const dayDelta = getLocalDayNumber(event.start) - getLocalDayNumber(oldEvent.start);

  if (!oldEvent.extendedProps.isDateRange) {
    return {
      dueDate: shiftByLocalDays(oldEvent.start, dayDelta),
    };
  }

  if (!isValidDate(oldEvent.end)) {
    return null;
  }

  return {
    startDate: shiftByLocalDays(oldEvent.start, dayDelta),
    dueDate: shiftByLocalDays(oldEvent.end, dayDelta),
  };
};

export const getCalendarEventResizeUpdate = (event, oldEvent) => {
  if (!event || !oldEvent || !isValidDate(event.start) || !isValidDate(oldEvent.start)) {
    return null;
  }

  if (!oldEvent.extendedProps.isDateRange) {
    if (event.start.getTime() !== oldEvent.start.getTime()) {
      if (event.start.getTime() > oldEvent.start.getTime()) {
        return null;
      }

      return {
        startDate: event.start,
        dueDate: oldEvent.start,
      };
    }

    if (!isValidDate(event.end) || oldEvent.start.getTime() > event.end.getTime()) {
      return null;
    }

    return {
      startDate: oldEvent.start,
      dueDate: event.end,
    };
  }

  if (
    !event.extendedProps.isDateRange ||
    !isValidDate(event.end) ||
    !isValidDate(oldEvent.end) ||
    event.start.getTime() > event.end.getTime()
  ) {
    return null;
  }

  const isStartChanged = event.start.getTime() !== oldEvent.start.getTime();
  const isEndChanged = event.end.getTime() !== oldEvent.end.getTime();

  if (isStartChanged === isEndChanged) {
    return null;
  }

  return isStartChanged ? { startDate: event.start } : { dueDate: event.end };
};

export const getCalendarEventResizeRollbackUpdate = (oldEvent, event) => {
  if (!oldEvent || !isValidDate(oldEvent.start)) {
    return null;
  }

  if (!oldEvent.extendedProps.isDateRange) {
    return {
      startDate: null,
      dueDate: oldEvent.start,
    };
  }

  return getCalendarEventResizeUpdate(oldEvent, event);
};

export const saveCalendarEventChange = ({
  event,
  oldEvent,
  revert,
  updateCard,
  getUpdate = getCalendarEventUpdate,
  getRollbackUpdate = getCalendarEventUpdate,
}) => {
  const data = getUpdate(event, oldEvent);
  const rollbackData = getRollbackUpdate(oldEvent, event);

  if (!data || !rollbackData) {
    revert();
    return false;
  }

  updateCard(event.extendedProps.cardId, data, {
    rollbackData,
    onFailure: revert,
  });

  return true;
};
