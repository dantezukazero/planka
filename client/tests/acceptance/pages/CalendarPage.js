import Config from '../Config.js';

export default class CalendarPage {
  constructor() {
    this.boardPath = process.env.CALENDAR_BOARD_PATH;
    this.cardTitle = process.env.CALENDAR_CARD_TITLE;

    this.calendarSelector = '[data-testid="calendar-view"]';
    this.calendarViewButtonSelector =
      'button[aria-label="Calendar"], button[aria-label="Kalender"]';
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
