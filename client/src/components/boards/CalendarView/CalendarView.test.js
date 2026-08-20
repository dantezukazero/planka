import fs from 'fs';

describe('CalendarView visual class contract', () => {
  const componentSource = fs.readFileSync(
    'src/components/boards/CalendarView/CalendarView.jsx',
    'utf8',
  );
  const stylesheetSource = fs.readFileSync(
    'src/components/boards/CalendarView/CalendarView.module.scss',
    'utf8',
  );

  test('keeps stable event and More-popover styling hooks', () => {
    expect(componentSource).toContain('eventClass={getCalendarEventClassName}');
    expect(componentSource).toContain('moreLinkClass="calendar-more-link"');
    expect(componentSource).toContain('popoverClass={styles.morePopover}');
    expect(componentSource).toContain('popoverCloseClass={styles.morePopoverClose}');

    expect(stylesheetSource).toContain(':global(.calendar-card-event)');
    expect(stylesheetSource).toContain(':global(.calendar-more-link)');
    expect(stylesheetSource).toContain('.morePopover {');
    expect(stylesheetSource).toContain('.morePopoverClose {');
  });

  test('keeps readable custom event content outside the app descendant scope for portals', () => {
    expect(stylesheetSource).toMatch(/\n\.eventContent \{/);
    expect(stylesheetSource).toMatch(/\n\.eventTime \{/);
    expect(stylesheetSource).toMatch(/\n\.eventTitle \{/);
    expect(stylesheetSource).toContain('color: var(--calendar-event-text, #172b4d);');
  });
});
