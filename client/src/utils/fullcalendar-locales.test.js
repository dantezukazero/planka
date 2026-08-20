/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { getFullCalendarLocaleCode } from './fullcalendar-locales';

describe('FullCalendar locale mapping', () => {
  test.each([
    ['de-DE', 'de-DE'],
    ['en-US', 'en'],
    ['en-GB', 'en-GB'],
  ])('maps %s to %s', (language, expected) => {
    expect(getFullCalendarLocaleCode(language)).toBe(expected);
  });

  test('falls back to English for an unsupported language', () => {
    expect(getFullCalendarLocaleCode('xx-XX')).toBe('en');
  });
});
