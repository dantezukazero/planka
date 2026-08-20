/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const getTrelloCardDateValues = (trelloCard) => ({
  startDate: trelloCard.start || null,
  dueDate: trelloCard.due || null,
  isDueCompleted: trelloCard.due && trelloCard.dueComplete,
});

module.exports = {
  getTrelloCardDateValues,
};
