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

  test('expands only a handled Month row and refreshes FullCalendar hit zones', () => {
    expect(componentSource).toContain('const [expandedMonthWeeks, setExpandedMonthWeeks]');
    expect(componentSource).toContain('moreLinkClick={handleMoreLinkClick}');
    expect(componentSource).toContain('moreLinkDidMount={handleMoreLinkDidMount}');
    expect(componentSource).toContain('dayCellDidMount={handleDayCellDidMount}');
    expect(componentSource).toContain('dayCellWillUnmount={handleDayCellWillUnmount}');
    expect(componentSource).toContain('if (info.view.type !== CalendarViews.MONTH)');
    expect(componentSource).toContain("return 'popover';");
    expect(componentSource).toContain('return true;');
    expect(componentSource).toContain('calendarApi.updateSize();');
    expect(componentSource).toContain('setExpandedMonthWeeks(resetExpandedMonthWeeks);');
  });

  test('guards only clicks immediately following FullCalendar drag or resize lifecycles', () => {
    expect(componentSource).toContain('eventDragStart={handleEventInteractionStart}');
    expect(componentSource).toContain('eventDragStop={handleEventInteractionStop}');
    expect(componentSource).toContain('eventResizeStart={handleEventInteractionStart}');
    expect(componentSource).toContain('eventResizeStop={handleEventInteractionStop}');
    expect(componentSource).toContain('if (eventInteractionGuardRef.current.shouldIgnoreClick())');
    expect(componentSource).toContain(
      "dispatch(push(Paths.CARDS.replace(':id', event.extendedProps.cardId)));",
    );
  });

  test('keeps the toolbar outside a responsive, internally scrolling Month grid', () => {
    expect(componentSource.indexOf('data-testid="calendar-toolbar"')).toBeLessThan(
      componentSource.indexOf('data-calendar-view={calendarView}'),
    );
    expect(componentSource).toContain('height="100%"');
    expect(componentSource).toContain('stickyHeaderDates');
    expect(stylesheetSource).toContain("&[data-calendar-view='dayGridMonth']");
    expect(stylesheetSource).toContain(':global(.calendar-month-week)');
    expect(stylesheetSource).toContain(
      ":global(.calendar-month-week[data-calendar-expanded-week='true'])",
    );
    expect(stylesheetSource).toContain('min-height: clamp(132px, 17vh, 160px);');
    expect(stylesheetSource).toContain('min-height: clamp(96px, 14vh, 124px);');
    expect(stylesheetSource).toContain('overflow: hidden;');
    expect(stylesheetSource).toContain('overscroll-behavior: contain;');
  });

  test('keeps readable custom event content outside the app descendant scope for portals', () => {
    expect(stylesheetSource).toMatch(/\n\.eventContent \{/);
    expect(stylesheetSource).toMatch(/\n\.eventTime \{/);
    expect(stylesheetSource).toMatch(/\n\.eventTitle \{/);
    expect(stylesheetSource).toContain('color: var(--calendar-event-text, #172b4d);');
  });
});
