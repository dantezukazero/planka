import Config from '../Config.js';

export default class CalendarPage {
  constructor() {
    this.boardPath = process.env.CALENDAR_BOARD_PATH;
    this.cardTitle = process.env.CALENDAR_CARD_TITLE;

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

  getCardModal() {
    return page.locator(this.cardModalSelector);
  }
}
