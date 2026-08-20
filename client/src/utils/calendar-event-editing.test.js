import {
  applyCalendarEditingPermissions,
  getCalendarEventDropUpdate,
  getCalendarEventResizeRollbackUpdate,
  getCalendarEventResizeUpdate,
  getCalendarEventUpdate,
  saveCalendarEventChange,
} from './calendar-event-editing';

const createEvent = ({ start, end = null, isDateRange = false } = {}) => ({
  start,
  end,
  extendedProps: {
    cardId: 'card-1',
    isDateRange,
  },
});

describe('calendar event editing', () => {
  test('keeps every event read-only for a viewer', () => {
    const events = [
      { id: 'single', extendedProps: { isDateRange: false } },
      { id: 'range', extendedProps: { isDateRange: true } },
    ];

    expect(applyCalendarEditingPermissions(events, false)).toEqual([
      expect.objectContaining({ id: 'single', startEditable: false, durationEditable: false }),
      expect.objectContaining({ id: 'range', startEditable: false, durationEditable: false }),
    ]);
  });

  test('allows an editor to drag and resize due-only and range events', () => {
    const events = [
      { id: 'single', extendedProps: { isDateRange: false } },
      { id: 'range', extendedProps: { isDateRange: true } },
    ];

    expect(applyCalendarEditingPermissions(events, true)).toEqual([
      expect.objectContaining({ id: 'single', startEditable: true, durationEditable: true }),
      expect.objectContaining({ id: 'range', startEditable: true, durationEditable: true }),
    ]);
  });

  test('moves a single due-date event without persisting its synthetic end', () => {
    const dueDate = new Date('2026-08-21T12:00:00.000Z');
    const syntheticEnd = new Date('2026-08-21T13:00:00.000Z');

    const update = getCalendarEventUpdate(createEvent({ start: dueDate, end: syntheticEnd }));

    expect(update).toEqual({ dueDate });
    expect(update).not.toHaveProperty('startDate');
  });

  test('moves a date range without changing its duration', () => {
    const startDate = new Date('2026-08-21T09:00:00.000Z');
    const dueDate = new Date('2026-08-23T17:00:00.000Z');

    expect(
      getCalendarEventUpdate(createEvent({ start: startDate, end: dueDate, isDateRange: true })),
    ).toEqual({ startDate, dueDate });
  });

  test('preserves a single event local time when Month converts a drop to all-day', () => {
    const oldEvent = createEvent({ start: new Date(2026, 7, 20, 9, 30) });
    oldEvent.allDay = false;
    const event = createEvent({ start: new Date(2026, 7, 21) });
    event.allDay = true;

    const { dueDate } = getCalendarEventDropUpdate(event, oldEvent);

    expect([
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
      dueDate.getHours(),
      dueDate.getMinutes(),
    ]).toEqual([2026, 7, 21, 9, 30]);
  });

  test('preserves range wall-clock times and duration across a Month drop', () => {
    const oldEvent = createEvent({
      start: new Date(2026, 9, 24, 9, 0),
      end: new Date(2026, 9, 26, 17, 0),
      isDateRange: true,
    });
    oldEvent.allDay = false;
    const event = createEvent({
      start: new Date(2026, 9, 25),
      end: new Date(2026, 9, 28),
      isDateRange: true,
    });
    event.allDay = true;

    const { startDate, dueDate } = getCalendarEventDropUpdate(event, oldEvent);

    expect([startDate.getDate(), startDate.getHours()]).toEqual([25, 9]);
    expect([dueDate.getDate(), dueDate.getHours()]).toEqual([27, 17]);
  });

  test('maps a range start resize exclusively to startDate', () => {
    const oldEvent = createEvent({
      start: new Date('2026-08-21T09:00:00.000Z'),
      end: new Date('2026-08-25T17:00:00.000Z'),
      isDateRange: true,
    });
    const event = createEvent({
      start: new Date('2026-08-22T09:00:00.000Z'),
      end: oldEvent.end,
      isDateRange: true,
    });

    expect(getCalendarEventResizeUpdate(event, oldEvent)).toEqual({
      startDate: event.start,
    });
  });

  test('maps a range end resize exclusively to dueDate', () => {
    const startDate = new Date('2026-08-21T09:00:00.000Z');
    const oldEvent = createEvent({
      start: startDate,
      end: new Date('2026-08-23T17:00:00.000Z'),
      isDateRange: true,
    });
    const event = createEvent({
      start: startDate,
      end: new Date('2026-08-25T17:00:00.000Z'),
      isDateRange: true,
    });

    expect(getCalendarEventResizeUpdate(event, oldEvent)).toEqual({
      dueDate: event.end,
    });
  });

  test('turns a due-only event into a range by resizing its right end', () => {
    const dueDate = new Date('2026-08-21T09:00:00.000Z');
    const oldEvent = createEvent({ start: dueDate });
    const event = createEvent({
      start: dueDate,
      end: new Date('2026-08-23T17:00:00.000Z'),
    });

    expect(getCalendarEventResizeUpdate(event, oldEvent)).toEqual({
      startDate: dueDate,
      dueDate: event.end,
    });
  });

  test('turns a due-only event into a range by resizing its left end', () => {
    const dueDate = new Date('2026-08-21T09:00:00.000Z');
    const oldEvent = createEvent({ start: dueDate });
    const event = createEvent({
      start: new Date('2026-08-20T09:00:00.000Z'),
      end: dueDate,
    });

    expect(getCalendarEventResizeUpdate(event, oldEvent)).toEqual({
      startDate: event.start,
      dueDate,
    });
  });

  test('rejects resizing a due-only event or range into an invalid order', () => {
    const dueDate = new Date('2026-08-21T09:00:00.000Z');
    const dueOnlyEvent = createEvent({ start: dueDate });
    const invalidDueOnlyResize = createEvent({
      start: new Date('2026-08-22T09:00:00.000Z'),
      end: dueDate,
    });
    const oldRange = createEvent({
      start: new Date('2026-08-21T09:00:00.000Z'),
      end: new Date('2026-08-25T17:00:00.000Z'),
      isDateRange: true,
    });
    const reversedRange = createEvent({
      start: new Date('2026-08-26T09:00:00.000Z'),
      end: oldRange.end,
      isDateRange: true,
    });

    expect(getCalendarEventResizeUpdate(invalidDueOnlyResize, dueOnlyEvent)).toBeNull();
    expect(getCalendarEventResizeUpdate(reversedRange, oldRange)).toBeNull();
  });

  test('saves valid changes with rollback data and a failure callback', () => {
    const updateCard = jest.fn();
    const revert = jest.fn();
    const oldEvent = createEvent({
      start: new Date('2026-08-20T12:00:00.000Z'),
    });
    const event = createEvent({ start: new Date('2026-08-21T12:00:00.000Z') });

    expect(saveCalendarEventChange({ event, oldEvent, revert, updateCard })).toBe(true);
    expect(updateCard).toHaveBeenCalledWith(
      'card-1',
      { dueDate: event.start },
      {
        rollbackData: { dueDate: oldEvent.start },
        onFailure: revert,
      },
    );
    expect(revert).not.toHaveBeenCalled();

    updateCard.mock.calls[0][2].onFailure(new Error('save failed'));
    expect(revert).toHaveBeenCalledTimes(1);
  });

  test('rolls back an invalid calendar mutation immediately', () => {
    const updateCard = jest.fn();
    const revert = jest.fn();
    const oldEvent = createEvent({
      start: new Date('2026-08-20T12:00:00.000Z'),
    });
    const event = createEvent({ start: null });

    expect(saveCalendarEventChange({ event, oldEvent, revert, updateCard })).toBe(false);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(updateCard).not.toHaveBeenCalled();
  });

  test('uses the changed range boundary for save and rollback after a start resize', () => {
    const updateCard = jest.fn();
    const revert = jest.fn();
    const oldEvent = createEvent({
      start: new Date('2026-08-20T09:00:00.000Z'),
      end: new Date('2026-08-23T17:00:00.000Z'),
      isDateRange: true,
    });
    const event = createEvent({
      start: new Date('2026-08-21T09:00:00.000Z'),
      end: oldEvent.end,
      isDateRange: true,
    });

    expect(
      saveCalendarEventChange({
        event,
        oldEvent,
        revert,
        updateCard,
        getUpdate: getCalendarEventResizeUpdate,
        getRollbackUpdate: getCalendarEventResizeRollbackUpdate,
      }),
    ).toBe(true);
    expect(updateCard).toHaveBeenCalledWith(
      'card-1',
      { startDate: event.start },
      {
        rollbackData: { startDate: oldEvent.start },
        onFailure: revert,
      },
    );

    updateCard.mock.calls[0][2].onFailure(new Error('save failed'));
    expect(revert).toHaveBeenCalledTimes(1);
  });

  test('uses only dueDate for save and rollback after an end resize', () => {
    const updateCard = jest.fn();
    const revert = jest.fn();
    const oldEvent = createEvent({
      start: new Date('2026-08-20T09:00:00.000Z'),
      end: new Date('2026-08-23T17:00:00.000Z'),
      isDateRange: true,
    });
    const event = createEvent({
      start: oldEvent.start,
      end: new Date('2026-08-24T17:00:00.000Z'),
      isDateRange: true,
    });

    expect(
      saveCalendarEventChange({
        event,
        oldEvent,
        revert,
        updateCard,
        getUpdate: getCalendarEventResizeUpdate,
        getRollbackUpdate: getCalendarEventResizeRollbackUpdate,
      }),
    ).toBe(true);
    expect(updateCard).toHaveBeenCalledWith(
      'card-1',
      { dueDate: event.end },
      {
        rollbackData: { dueDate: oldEvent.end },
        onFailure: revert,
      },
    );
  });

  test('restores the original due-only state after a range-creation save failure', () => {
    const updateCard = jest.fn();
    const revert = jest.fn();
    const dueDate = new Date('2026-08-20T09:00:00.000Z');
    const oldEvent = createEvent({ start: dueDate });
    const event = createEvent({
      start: dueDate,
      end: new Date('2026-08-22T17:00:00.000Z'),
    });

    expect(
      saveCalendarEventChange({
        event,
        oldEvent,
        revert,
        updateCard,
        getUpdate: getCalendarEventResizeUpdate,
        getRollbackUpdate: getCalendarEventResizeRollbackUpdate,
      }),
    ).toBe(true);
    expect(updateCard).toHaveBeenCalledWith(
      'card-1',
      { startDate: dueDate, dueDate: event.end },
      {
        rollbackData: { startDate: null, dueDate },
        onFailure: revert,
      },
    );

    updateCard.mock.calls[0][2].onFailure(new Error('save failed'));
    expect(revert).toHaveBeenCalledTimes(1);
  });
});
