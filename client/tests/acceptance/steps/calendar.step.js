import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import CalendarPage from '../pages/CalendarPage.js';

const calendarPage = new CalendarPage();

Given('the configured calendar board is open', async () => {
  await calendarPage.navigate();
});

Given('the configured crowded calendar board is open', async () => {
  await calendarPage.navigateToCrowdedBoard();
});

When('the user selects the Calendar board view', async () => {
  await calendarPage.selectCalendarView();
});

When('the user opens the configured due-date card from the calendar', async () => {
  await calendarPage.getDueDateCardEvent().click();
});

When('the user adds a start to the open card', async () => {
  await calendarPage.setStartOnOpenCard();
});

When('the user drags the configured range card to the next day', async () => {
  await calendarPage.dragRangeCardToNextDay();
});

When('the user extends the configured range card by one day', async () => {
  await calendarPage.extendRangeCardByOneDay();
});

When('the user moves the start of the configured range card one day later', async () => {
  await calendarPage.moveRangeCardStartOneDayLater();
});

When('the user extends the configured due-only resize card by one day', async () => {
  await calendarPage.extendDueOnlyCardByOneDay();
});

When('the user opens the configured due-only resize card from the calendar', async () => {
  await calendarPage.getDueOnlyResizeCardEvent().click();
});

When('the user expands the crowded calendar week', async () => {
  await calendarPage.expandCrowdedWeek();
});

When('the user drags the configured hidden calendar card to the next day', async () => {
  await calendarPage.dragCrowdedCardToNextDay();
});

When('the user navigates to the next calendar month', async () => {
  await calendarPage.navigateToNextMonth();
});

When('the user extends the same-day range from its start by one day', async () => {
  await calendarPage.extendSameDayRangeFromStart();
});

When('the user shrinks the range back to the same day from its start', async () => {
  await calendarPage.shrinkSameDayRangeFromStart();
});

When('the user extends the same-day range from its end by one day', async () => {
  await calendarPage.extendSameDayRangeFromEnd();
});

When('the user collapses the crowded range from its end by one day', async () => {
  await calendarPage.collapseCollapsibleRangeFromEnd();
});

When('the user extends the crowded range from its end by one day', async () => {
  await calendarPage.extendCollapsibleRangeFromEnd();
});

When('the user collapses the crowded range from its start by one day', async () => {
  await calendarPage.collapseCollapsibleRangeFromStart();
});

When('the user extends the crowded range from its start by one day', async () => {
  await calendarPage.extendCollapsibleRangeFromStart();
});

When('the user normally opens the configured same-day range', async () => {
  await calendarPage.getSameDayRangeCardEvent().click();
});

When('the user normally opens the configured crowded range', async () => {
  await calendarPage.getCollapsibleRangeCardEvent().click();
});

When('the user selects the Week calendar view', async () => {
  await calendarPage.selectCalendarSubview('timeGridWeek');
});

When('the user selects the Month calendar view', async () => {
  await calendarPage.selectCalendarSubview('dayGridMonth');
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

Then('the configured range card should be visible in the calendar', async () => {
  await expect(calendarPage.getRangeCardEvent()).toBeVisible();
});

Then('the configured due-only resize card should be visible in the calendar', async () => {
  await expect(calendarPage.getDueOnlyResizeCardEvent()).toBeVisible();
});

Then('the configured due-only resize card should expose start and end resize handles', async () => {
  await expect(calendarPage.getDueOnlyCardStartResizeHandle()).toBeAttached();
  await expect(calendarPage.getDueOnlyCardEndResizeHandle()).toBeAttached();
});

Then('a calendar More-link should be visible', async () => {
  await expect(calendarPage.getMoreLink()).toBeVisible();
});

Then('no calendar More-popover should be visible', async () => {
  await expect(calendarPage.getMorePopover()).toHaveCount(0);
});

Then('only the crowded calendar week should be expanded', async () => {
  await expect(calendarPage.getExpandedMonthWeeks()).toHaveCount(1);
});

Then('the configured hidden calendar card should be visible in the month grid', async () => {
  await expect(calendarPage.getCrowdedCardEvent()).toBeVisible();
});

Then('the calendar card move should be saved', async () => {
  await expect(calendarPage.getCrowdedCardEvent()).toBeVisible();
});

Then('the Month calendar should start with no expanded weeks', async () => {
  await expect(calendarPage.getExpandedMonthWeeks()).toHaveCount(0);
});

Then('the configured same-day range should be visible in the expanded week', async () => {
  await expect(calendarPage.getSameDayRangeCardEvent()).toBeVisible();
});

Then('the configured same-day range should expose start and end resize handles', async () => {
  await expect(calendarPage.getSameDayRangeStartResizeHandle()).toBeAttached();
  await expect(calendarPage.getSameDayRangeEndResizeHandle()).toBeAttached();
});

Then('the configured crowded range should be a same-day range', async () => {
  await expect(calendarPage.getCollapsibleRangeCardEvent()).toHaveClass(
    /calendar-card-range-event/,
  );
  await calendarPage.assertCollapsibleRangeDaySpan(1);
});

Then('the configured crowded range should be a two-day range', async () => {
  await expect(calendarPage.getCollapsibleRangeCardEvent()).toHaveClass(
    /calendar-card-range-event/,
  );
  await calendarPage.assertCollapsibleRangeDaySpan(2);
});

Then('the configured crowded range should expose start and end resize handles', async () => {
  await expect(calendarPage.getCollapsibleRangeStartResizeHandle()).toBeAttached();
  await expect(calendarPage.getCollapsibleRangeEndResizeHandle()).toBeAttached();
});

Then('the original crowded range end time should be preserved', async () => {
  await calendarPage.assertCollapsibleRangeEndTimePreserved();
});

Then('no card modal should have opened during the resize gestures', async () => {
  await expect(calendarPage.getCardModal()).toHaveCount(0);
});

Then('the configured range card should expose start and end resize handles', async () => {
  await expect(calendarPage.getRangeCardStartResizeHandle()).toBeAttached();
  await expect(calendarPage.getRangeCardEndResizeHandle()).toBeAttached();
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

Then('the open card should show a date range', async () => {
  await expect(calendarPage.getOpenCardDateRange()).toContainText(/From|Von/);
  await expect(calendarPage.getOpenCardDateRange()).toContainText(/Until|Bis/);
});
