/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector as createReselectSelector } from 'reselect';
import { createSelector as createReduxOrmSelector } from 'redux-orm';

import orm from '../orm';
import { selectPath } from './router';
import { selectCurrentUserId } from './users';

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const createCalendarEvent = (cardModel) => {
  const labels = cardModel.labels.toRefArray().map(({ id, name, color }) => ({ id, name, color }));
  const hasValidRange =
    isValidDate(cardModel.startDate) &&
    isValidDate(cardModel.dueDate) &&
    cardModel.startDate.getTime() <= cardModel.dueDate.getTime();
  const userIds = cardModel.users.toRefArray().map((user) => user.id);
  const labelIds = labels.map((label) => label.id);

  return {
    id: cardModel.id,
    title: cardModel.name,
    start: hasValidRange ? cardModel.startDate : cardModel.dueDate,
    ...(hasValidRange && {
      end: cardModel.dueDate,
    }),
    ...(!hasValidRange && {
      display: 'block',
    }),
    allDay: false,
    extendedProps: {
      cardId: cardModel.id,
      userIds,
      labelIds,
      labels,
      isDateRange: hasValidRange,
    },
  };
};

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
      .filter((cardModel) => isValidDate(cardModel.dueDate))
      .map(createCalendarEvent);
  },
);

export const selectMyCalendarEventsForCurrentBoard = createReselectSelector(
  selectCalendarEventsForCurrentBoard,
  selectCurrentUserId,
  (events, currentUserId) =>
    events && events.filter((event) => event.extendedProps.userIds.includes(currentUserId)),
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
      boardModel.getCardsModelArray().some((cardModel) => isValidDate(cardModel.dueDate))
    );
  },
);

export default {
  selectCalendarEventsForCurrentBoard,
  selectMyCalendarEventsForCurrentBoard,
  selectHasDueDateCardsForCurrentBoard,
};
