import Config from '../Config.js';

export default class CalendarPage {
  constructor() {
    this.boardPath = process.env.CALENDAR_BOARD_PATH;
    this.cardTitle = process.env.CALENDAR_CARD_TITLE;
    this.rangeCardTitle = process.env.CALENDAR_RANGE_CARD_TITLE;

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

  async navigate() {
    this.assertConfigured();
    await page.goto(new URL(this.boardPath, Config.BASE_URL).toString());
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

  getRangeCardResizeHandle() {
    return this.getRangeCardEvent().locator('.calendar-card-resize-handle');
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
    const handle = this.getRangeCardResizeHandle();
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

    const dueDate = await editor.locator('input[name="dueDate"]').inputValue();
    const dueTime = await editor.locator('input[name="dueTime"]').inputValue();
    await editor.locator('input[name="startDate"]').fill(dueDate);
    await editor.locator('input[name="startTime"]').fill(dueTime);
    await editor.getByRole('button', { name: /Save|Speichern/ }).click();
    await editor.waitFor({ state: 'detached' });
  }

  getOpenCardDateRange() {
    return this.getCardModal().getByTestId('card-date-range');
  }
}
