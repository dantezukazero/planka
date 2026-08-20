import {
  CALENDAR_VISUAL_DURATION_OPTIONS,
  getCalendarEventTimeText,
} from './calendar-event-display';

describe('calendar event display', () => {
  test('uses a one-hour visual duration for open-ended timed events', () => {
    expect(CALENDAR_VISUAL_DURATION_OPTIONS).toEqual({
      forceEventDuration: true,
      defaultTimedEventDuration: '01:00',
    });
  });

  test('shows only the persisted due instant for a due-only Agenda event', () => {
    const event = {
      start: new Date(2026, 7, 20, 13, 9),
      end: new Date(2026, 7, 20, 14, 9),
      extendedProps: { isDateRange: false },
    };

    const timeText = getCalendarEventTimeText(event, '13:09 - 14:09', 'de-DE');

    expect(timeText).toBe('13:09');
    expect(timeText).not.toContain('14:09');
    expect(timeText).not.toContain('-');
  });

  test('keeps FullCalendar range text for a persisted date range', () => {
    const event = {
      start: new Date('2026-08-20T13:09:00.000Z'),
      end: new Date('2026-08-20T14:09:00.000Z'),
      extendedProps: { isDateRange: true },
    };

    expect(getCalendarEventTimeText(event, '15:09 - 16:09', 'de-DE')).toBe('15:09 - 16:09');
  });
});
