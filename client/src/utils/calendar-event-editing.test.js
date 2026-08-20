import {
  applyCalendarEditingPermissions,
  getCalendarEventDropUpdate,
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

  test('allows an editor to drag all events but resize only ranges', () => {
    const events = [
      { id: 'single', extendedProps: { isDateRange: false } },
      { id: 'range', extendedProps: { isDateRange: true } },
    ];

    expect(applyCalendarEditingPermissions(events, true)).toEqual([
      expect.objectContaining({ id: 'single', startEditable: true, durationEditable: false }),
      expect.objectContaining({ id: 'range', startEditable: true, durationEditable: true }),
    ]);
  });

  test('moves a single due-date event', () => {
    const dueDate = new Date('2026-08-21T12:00:00.000Z');

    expect(getCalendarEventUpdate(createEvent({ start: dueDate }))).toEqual({
      dueDate,
    });
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

  test('maps a range end resize to startDate and dueDate', () => {
    const startDate = new Date('2026-08-21T09:00:00.000Z');
    const dueDate = new Date('2026-08-25T17:00:00.000Z');

    expect(
      getCalendarEventUpdate(createEvent({ start: startDate, end: dueDate, isDateRange: true })),
    ).toEqual({ startDate, dueDate });
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
});
