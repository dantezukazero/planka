/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const isCardDateRangeValid = (startDate, dueDate) => {
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
    return false;
  }

  if (!startDate) {
    return true;
  }

  if (!dueDate || Number.isNaN(new Date(startDate).getTime())) {
    return false;
  }

  return new Date(startDate).getTime() <= new Date(dueDate).getTime();
};

const getEffectiveCardDateRange = (record, values) => ({
  startDate: Object.prototype.hasOwnProperty.call(values, 'startDate')
    ? values.startDate
    : record.startDate,
  dueDate: Object.prototype.hasOwnProperty.call(values, 'dueDate')
    ? values.dueDate
    : record.dueDate,
});

module.exports = {
  getEffectiveCardDateRange,
  isCardDateRangeValid,
};
