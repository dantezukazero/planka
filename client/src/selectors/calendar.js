/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector as createReselectSelector } from 'reselect';
import { createSelector as createReduxOrmSelector } from 'redux-orm';

import orm from '../orm';
import { selectPath } from './router';
import { selectCurrentUserId } from './users';

const createCalendarEvent = (cardModel) => ({
  id: cardModel.id,
  title: cardModel.name,
  start: cardModel.dueDate,
  allDay: false,
  cardId: cardModel.id,
  userIds: cardModel.users.toRefArray().map((user) => user.id),
  labelIds: cardModel.labels.toRefArray().map((label) => label.id),
});

export const selectCalendarEventsForCurrentBoard = createReduxOrmSelector(
  orm,
  (state) => selectPath(state).boardId,
  ({ Board }, boardId) => {
    if (!boardId) {
      return boardId;
    }

    const boardModel = Board.withId(boardId);

    if (!boardModel) {
      return boardModel;
    }

    return boardModel
      .getFilteredCardsModelArray()
      .filter((cardModel) => cardModel.dueDate !== null)
      .map(createCalendarEvent);
  },
);

export const selectMyCalendarEventsForCurrentBoard = createReselectSelector(
  selectCalendarEventsForCurrentBoard,
  selectCurrentUserId,
  (events, currentUserId) =>
    events && events.filter((event) => event.userIds.includes(currentUserId)),
);

export const selectHasDueDateCardsForCurrentBoard = createReduxOrmSelector(
  orm,
  (state) => selectPath(state).boardId,
  ({ Board }, boardId) => {
    if (!boardId) {
      return false;
    }

    const boardModel = Board.withId(boardId);

    return (
      !!boardModel &&
      boardModel.getCardsModelArray().some((cardModel) => cardModel.dueDate !== null)
    );
  },
);

export default {
  selectCalendarEventsForCurrentBoard,
  selectMyCalendarEventsForCurrentBoard,
  selectHasDueDateCardsForCurrentBoard,
};
