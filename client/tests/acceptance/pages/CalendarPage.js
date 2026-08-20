import Config from '../Config.js';

export default class CalendarPage {
  constructor() {
    this.boardPath = process.env.CALENDAR_BOARD_PATH;
    this.cardTitle = process.env.CALENDAR_CARD_TITLE;
    this.rangeCardTitle = process.env.CALENDAR_RANGE_CARD_TITLE;
    this.dueOnlyResizeCardTitle = process.env.CALENDAR_DUE_ONLY_RESIZE_CARD_TITLE;
    this.crowdedBoardPath = process.env.CALENDAR_CROWDED_BOARD_PATH || this.boardPath;
    this.crowdedCardTitle = process.env.CALENDAR_CROWDED_CARD_TITLE;

    this.calendarSelector = '[data-testid="calendar-view"]';
    this.calendarViewButtonSelector =
      'button[aria-label="Calendar"], button[aria-label="Kalender"]';
    this.calendarSubviewSelector =
      'select[aria-label="Calendar view"], select[aria-label="Kalenderansicht"]';
    this.boardActionsButtonSelector =
      'button[aria-label="Board Actions"], button[aria-label="Arbeitsbereich-Aktionen"]';
    this.cardModalSelector = '.ui.modal.visible';
  }

  assertConfigured() {
    if (!this.boardPath || !this.cardTitle) {
      throw new Error(
        'CALENDAR_BOARD_PATH and CALENDAR_CARD_TITLE must identify a board fixture with a due-date card',
      );
    }
  }

  assertRangeConfigured() {
    if (!this.rangeCardTitle) {
      throw new Error(
        'CALENDAR_RANGE_CARD_TITLE must identify an editable card with startDate and dueDate',
      );
    }
  }

  assertDueOnlyResizeConfigured() {
    if (!this.dueOnlyResizeCardTitle) {
      throw new Error(
        'CALENDAR_DUE_ONLY_RESIZE_CARD_TITLE must identify an editable due-only card',
      );
    }
  }

  assertCrowdedCalendarConfigured() {
    if (!this.crowdedBoardPath || !this.crowdedCardTitle) {
      throw new Error(
        'CALENDAR_CROWDED_BOARD_PATH (or CALENDAR_BOARD_PATH) and CALENDAR_CROWDED_CARD_TITLE must identify a crowded editable Month fixture',
      );
    }
  }

  async navigate() {
    this.assertConfigured();
    await page.goto(new URL(this.boardPath, Config.BASE_URL).toString());
  }

  async navigateToCrowdedBoard() {
    this.assertCrowdedCalendarConfigured();
    await page.goto(new URL(this.crowdedBoardPath, Config.BASE_URL).toString());
  }

  async selectCalendarView() {
    await page.click(this.calendarViewButtonSelector);
  }

  getCalendar() {
    return page.locator(this.calendarSelector);
  }

  async selectCalendarSubview(view) {
    await page.locator(this.calendarSubviewSelector).selectOption(view);
  }

  getCalendarSubview(view) {
    return page.locator(`${this.calendarSelector} [data-calendar-view="${view}"]`);
  }

  async openViewManager() {
    await page.click(this.boardActionsButtonSelector);
    await page.getByText(/Manage Views|Ansichten verwalten/, { exact: true }).click();
  }

  async hideBoardView(view) {
    const checkbox = page.locator(`input[value="${view}"]`);

    if (await checkbox.isChecked()) {
      await checkbox.uncheck({ force: true });
    }
  }

  async reload() {
    await page.reload();
  }

  getBoardViewButton(view) {
    const labels = {
      grid: ['Grid', 'Raster'],
      list: ['List', 'Liste'],
    };

    return page.locator(labels[view].map((label) => `button[aria-label="${label}"]`).join(', '));
  }

  getDueDateCardEvent() {
    this.assertConfigured();
    return page.locator(`${this.calendarSelector} .calendar-card-event`, {
      hasText: this.cardTitle,
    });
  }

  getRangeCardEvent() {
    this.assertRangeConfigured();
    return page.locator(`${this.calendarSelector} .calendar-card-event`, {
      hasText: this.rangeCardTitle,
    });
  }

  getDueOnlyResizeCardEvent() {
    this.assertDueOnlyResizeConfigured();
    return page.locator(`${this.calendarSelector} .calendar-card-event`, {
      hasText: this.dueOnlyResizeCardTitle,
    });
  }

  getMoreLink() {
    return page.locator(`${this.calendarSelector} .calendar-more-link`).first();
  }

  getMorePopover() {
    return page.locator('[role="dialog"][id*="popover-"]');
  }

  getExpandedMonthWeeks() {
    return page.locator(
      `${this.calendarSelector} .calendar-month-week[data-calendar-expanded-week="true"]`,
    );
  }

  getCrowdedCardEvent() {
    this.assertCrowdedCalendarConfigured();
    return page.locator(`${this.calendarSelector} .calendar-card-event`, {
      hasText: this.crowdedCardTitle,
    });
  }

  async expandCrowdedWeek() {
    await this.getMoreLink().click();
    await this.getExpandedMonthWeeks().waitFor({ state: 'attached' });
  }

  async dragCrowdedCardToNextDay() {
    const event = this.getCrowdedCardEvent();
    const expandedWeek = this.getExpandedMonthWeeks();
    const dayCell = expandedWeek.locator('.calendar-month-day-cell').first();
    const [eventBox, dayCellBox] = await Promise.all([event.boundingBox(), dayCell.boundingBox()]);

    if (!eventBox || !dayCellBox) {
      throw new Error(
        'The crowded event or expanded calendar day cell has no visible bounding box',
      );
    }

    const updateResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname.startsWith('/api/cards/') &&
        response.ok(),
    );

    await page.mouse.move(eventBox.x + eventBox.width / 2, eventBox.y + eventBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      eventBox.x + eventBox.width / 2 + dayCellBox.width,
      eventBox.y + eventBox.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await updateResponse;
    await event.waitFor({ state: 'visible' });
  }

  async navigateToNextMonth() {
    await page.locator(`${this.calendarSelector} button[value="next"]`).click();
    await page.locator(`${this.calendarSelector} [data-calendar-view="dayGridMonth"]`).waitFor();
  }

  getRangeCardStartResizeHandle() {
    return this.getRangeCardEvent().locator('.calendar-card-start-resize-handle');
  }

  getRangeCardEndResizeHandle() {
    return this.getRangeCardEvent().locator('.calendar-card-end-resize-handle');
  }

  getDueOnlyCardEndResizeHandle() {
    return this.getDueOnlyResizeCardEvent().locator('.calendar-card-end-resize-handle');
  }

  getDueOnlyCardStartResizeHandle() {
    return this.getDueOnlyResizeCardEvent().locator('.calendar-card-start-resize-handle');
  }

  async dragRangeCardToNextDay() {
    const event = this.getRangeCardEvent();
    const dayCell = page.locator(`${this.calendarSelector} .fc-daygrid-day`).first();
    const [eventBox, dayCellBox] = await Promise.all([event.boundingBox(), dayCell.boundingBox()]);

    if (!eventBox || !dayCellBox) {
      throw new Error('The range event or calendar day cell has no visible bounding box');
    }

    await page.mouse.move(eventBox.x + eventBox.width / 2, eventBox.y + eventBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      eventBox.x + eventBox.width / 2 + dayCellBox.width,
      eventBox.y + eventBox.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await event.waitFor({ state: 'visible' });
  }

  async extendRangeCardByOneDay() {
    const handle = this.getRangeCardEndResizeHandle();
    const dayCell = page.locator(`${this.calendarSelector} .fc-daygrid-day`).first();
    const [handleBox, dayCellBox] = await Promise.all([
      handle.boundingBox(),
      dayCell.boundingBox(),
    ]);

    if (!handleBox || !dayCellBox) {
      throw new Error('The range resize handle or calendar day cell has no visible bounding box');
    }

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 + dayCellBox.width,
      handleBox.y + handleBox.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await this.getRangeCardEvent().waitFor({ state: 'visible' });
  }

  async moveRangeCardStartOneDayLater() {
    const handle = this.getRangeCardStartResizeHandle();
    const dayCell = page.locator(`${this.calendarSelector} .fc-daygrid-day`).first();
    const [handleBox, dayCellBox] = await Promise.all([
      handle.boundingBox(),
      dayCell.boundingBox(),
    ]);

    if (!handleBox || !dayCellBox) {
      throw new Error('The range start handle or calendar day cell has no visible bounding box');
    }

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 + dayCellBox.width,
      handleBox.y + handleBox.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await this.getRangeCardEvent().waitFor({ state: 'visible' });
  }

  async extendDueOnlyCardByOneDay() {
    const handle = this.getDueOnlyCardEndResizeHandle();
    const dayCell = page.locator(`${this.calendarSelector} .fc-daygrid-day`).first();
    const [handleBox, dayCellBox] = await Promise.all([
      handle.boundingBox(),
      dayCell.boundingBox(),
    ]);

    if (!handleBox || !dayCellBox) {
      throw new Error('The due-only end handle or calendar day cell has no visible bounding box');
    }

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      handleBox.x + handleBox.width / 2 + dayCellBox.width,
      handleBox.y + handleBox.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await this.getDueOnlyResizeCardEvent().waitFor({ state: 'visible' });
  }

  getCardModal() {
    return page.locator(this.cardModalSelector);
  }

  async setStartOnOpenCard() {
    await this.getCardModal().getByTestId('card-date-range').click();

    const editor = page.getByTestId('date-range-editor');
    const startToggle = editor.locator('input[type="checkbox"]');
    if (!(await startToggle.isChecked())) {
      await startToggle.check({ force: true });
    }

    const picker = editor.getByTestId('date-range-picker');
    if ((await picker.getAttribute('data-active-field')) !== 'start') {
      throw new Error('Enabling From did not activate start selection');
    }

    await picker.locator('.react-datepicker__day--selected').first().click();
    if ((await picker.getAttribute('data-active-field')) !== 'due') {
      throw new Error('Selecting From did not keep the picker open in Until selection mode');
    }
    if (
      (await picker.locator('.calendar-date-range-start').count()) === 0 ||
      (await picker.locator('.calendar-date-range-end').count()) === 0
    ) {
      throw new Error('The selected date range boundaries are not visibly marked');
    }

    await picker.locator('.calendar-date-range-end').first().click();
    await editor.getByRole('button', { name: /Save|Speichern/ }).click();
    await editor.waitFor({ state: 'detached' });
  }

  getOpenCardDateRange() {
    return this.getCardModal().getByTestId('card-date-range');
  }
}
