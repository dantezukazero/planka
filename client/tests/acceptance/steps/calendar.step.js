import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import CalendarPage from '../pages/CalendarPage.js';

const calendarPage = new CalendarPage();

Given('the configured calendar board is open', async () => {
  await calendarPage.navigate();
});

When('the user selects the Calendar board view', async () => {
  await calendarPage.selectCalendarView();
});

When('the user opens the configured due-date card from the calendar', async () => {
  await calendarPage.getDueDateCardEvent().click();
});

Then('the board calendar should be visible', async () => {
  await expect(calendarPage.getCalendar()).toBeVisible();
});

Then('the configured due-date card should be visible in the calendar', async () => {
  await expect(calendarPage.getDueDateCardEvent()).toBeVisible();
});

Then('the existing card modal should be visible', async () => {
  await expect(calendarPage.getCardModal()).toBeVisible();
});
