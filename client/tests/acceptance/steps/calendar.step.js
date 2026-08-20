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

When('the user selects the Week calendar view', async () => {
  await calendarPage.selectCalendarSubview('timeGridWeek');
});

When('the user selects the Agenda calendar view', async () => {
  await calendarPage.selectCalendarSubview('listMonth');
});

When('the user opens the board view manager', async () => {
  await calendarPage.openViewManager();
});

When('the user hides the Grid and List board views', async () => {
  await calendarPage.hideBoardView('grid');
  await calendarPage.hideBoardView('list');
});

When('the user reloads the board', async () => {
  await calendarPage.reload();
});

Then('the board calendar should be visible', async () => {
  await expect(calendarPage.getCalendar()).toBeVisible();
});

Then('the configured due-date card should be visible in the calendar', async () => {
  await expect(calendarPage.getDueDateCardEvent()).toBeVisible();
});

Then('the Month calendar view should be visible', async () => {
  await expect(calendarPage.getCalendarSubview('dayGridMonth')).toBeVisible();
});

Then('the Week calendar view should be visible', async () => {
  await expect(calendarPage.getCalendarSubview('timeGridWeek')).toBeVisible();
});

Then('the Agenda calendar view should be visible', async () => {
  await expect(calendarPage.getCalendarSubview('listMonth')).toBeVisible();
});

Then('the Grid and List board views should remain hidden', async () => {
  await expect(calendarPage.getBoardViewButton('grid')).toHaveCount(0);
  await expect(calendarPage.getBoardViewButton('list')).toHaveCount(0);
});

Then('the existing card modal should be visible', async () => {
  await expect(calendarPage.getCardModal()).toBeVisible();
});
