/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import orm from '../orm';
import {
  selectCalendarEventsForCurrentBoard,
  selectHasDueDateCardsForCurrentBoard,
  selectMyCalendarEventsForCurrentBoard,
} from './calendar';
import { BoardMembershipRoles, BoardViews, ListTypes, UserRoles } from '../constants/Enums';

jest.mock('../assets/images/deleted-user.png', () => 'deleted-user.png');
jest.mock('../constants/Config', () => ({
  __esModule: true,
  default: {
    BASE_PATH: '',
  },
}));

const CURRENT_USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const BOARD_ID = 'board-1';

const createState = ({ cards = [], filterUserIds = [], filterLabelIds = [], search = '' } = {}) => {
  const session = orm.mutableSession(orm.getEmptyState());

  session.User.create({
    id: CURRENT_USER_ID,
    name: 'Current user',
    role: UserRoles.BOARD_USER,
  });
  session.User.create({
    id: OTHER_USER_ID,
    name: 'Other user',
    role: UserRoles.BOARD_USER,
  });
  session.Project.create({
    id: 'project-1',
    name: 'Project',
  });
  session.Board.create({
    id: BOARD_ID,
    projectId: 'project-1',
    name: 'Board',
    view: BoardViews.CALENDAR,
    search,
  });
  session.BoardMembership.create({
    id: 'board-membership-1',
    boardId: BOARD_ID,
    userId: CURRENT_USER_ID,
    role: BoardMembershipRoles.EDITOR,
  });

  ['active', 'closed', 'archive', 'trash'].forEach((listType, index) => {
    session.List.create({
      id: `list-${listType}`,
      boardId: BOARD_ID,
      type: listType,
      name: listType,
      position: index,
    });
  });

  session.Board.create({
    id: 'board-2',
    projectId: 'project-1',
    name: 'Other board',
    view: BoardViews.KANBAN,
    search: '',
  });
  session.List.create({
    id: 'list-other-board',
    boardId: 'board-2',
    type: ListTypes.ACTIVE,
    name: 'Other board list',
    position: 0,
  });

  session.Label.create({
    id: 'label-1',
    boardId: BOARD_ID,
    name: 'First label',
    color: 'berry-red',
    position: 0,
  });
  session.Label.create({
    id: 'label-2',
    boardId: BOARD_ID,
    name: 'Second label',
    color: 'lagoon-blue',
    position: 1,
  });

  cards.forEach(
    ({
      id,
      name = id,
      startDate = null,
      dueDate = null,
      listType = ListTypes.ACTIVE,
      boardId = BOARD_ID,
      userIds = [],
      labelIds = [],
    }) => {
      const listId = boardId === BOARD_ID ? `list-${listType}` : 'list-other-board';

      session.Card.create({
        id,
        boardId,
        listId,
        name,
        startDate,
        dueDate,
        position: 0,
      });

      userIds.forEach((userId) => session.Card.withId(id).users.add(userId));
      labelIds.forEach((labelId) => session.Card.withId(id).labels.add(labelId));
    },
  );

  filterUserIds.forEach((userId) => session.Board.withId(BOARD_ID).filterUsers.add(userId));
  filterLabelIds.forEach((labelId) => session.Board.withId(BOARD_ID).filterLabels.add(labelId));

  return {
    auth: {
      userId: CURRENT_USER_ID,
    },
    router: {
      location: {
        pathname: `/boards/${BOARD_ID}`,
      },
    },
    orm: session.state,
  };
};

describe('selectCalendarEventsForCurrentBoard', () => {
  test('excludes a card without a due date', () => {
    const state = createState({ cards: [{ id: 'card-1' }] });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([]);
  });

  test('excludes a card with an invalid due-date value', () => {
    const state = createState({ cards: [{ id: 'card-1', dueDate: new Date('invalid') }] });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([]);
  });

  test('includes a card with its title and identifiers', () => {
    const dueDate = new Date('2026-08-20T12:30:00.000Z');
    const state = createState({
      cards: [{ id: 'card-1', name: 'Calendar card', dueDate }],
    });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([
      {
        id: 'card-1',
        title: 'Calendar card',
        start: dueDate,
        allDay: false,
        extendedProps: {
          cardId: 'card-1',
          userIds: [],
          labelIds: [],
          labels: [],
          isDateRange: false,
        },
      },
    ]);
  });

  test('maps two cards', () => {
    const state = createState({
      cards: [
        { id: 'card-1', dueDate: new Date('2026-08-20T12:00:00.000Z') },
        { id: 'card-2', dueDate: new Date('2026-08-21T12:00:00.000Z') },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state).map(({ id }) => id)).toEqual([
      'card-1',
      'card-2',
    ]);
  });

  test('maps a multi-day card to an exact timed range', () => {
    const startDate = new Date('2026-08-20T09:00:00.000Z');
    const dueDate = new Date('2026-08-23T17:00:00.000Z');
    const state = createState({
      cards: [{ id: 'card-1', startDate, dueDate }],
    });

    expect(selectCalendarEventsForCurrentBoard(state)[0]).toEqual(
      expect.objectContaining({
        start: startDate,
        end: dueDate,
        allDay: false,
        extendedProps: expect.objectContaining({ isDateRange: true }),
      }),
    );
  });

  test('maps a same-day range without changing either timestamp', () => {
    const startDate = new Date('2026-08-20T09:00:00.000Z');
    const dueDate = new Date('2026-08-20T17:00:00.000Z');
    const state = createState({
      cards: [{ id: 'card-1', startDate, dueDate }],
    });

    const [event] = selectCalendarEventsForCurrentBoard(state);

    expect([event.start, event.end]).toEqual([startDate, dueDate]);
  });

  test('falls back to the due-date instant for an invalid stored range', () => {
    const startDate = new Date('2026-08-21T09:00:00.000Z');
    const dueDate = new Date('2026-08-20T17:00:00.000Z');
    const state = createState({
      cards: [{ id: 'card-1', startDate, dueDate }],
    });

    expect(selectCalendarEventsForCurrentBoard(state)[0]).toEqual(
      expect.objectContaining({
        start: dueDate,
        extendedProps: expect.objectContaining({ isDateRange: false }),
      }),
    );
    expect(selectCalendarEventsForCurrentBoard(state)[0]).not.toHaveProperty('end');
  });

  test('maps card memberships to userIds', () => {
    const state = createState({
      cards: [
        {
          id: 'card-1',
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
          userIds: [CURRENT_USER_ID, OTHER_USER_ID],
        },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state)[0].extendedProps.userIds).toEqual([
      CURRENT_USER_ID,
      OTHER_USER_ID,
    ]);
  });

  test('my tasks includes only cards where the current user is a card member', () => {
    const dueDate = new Date('2026-08-20T12:00:00.000Z');
    const state = createState({
      cards: [
        { id: 'mine', dueDate, userIds: [CURRENT_USER_ID] },
        { id: 'theirs', dueDate, userIds: [OTHER_USER_ID] },
        { id: 'unassigned', dueDate },
      ],
    });

    expect(selectMyCalendarEventsForCurrentBoard(state).map(({ id }) => id)).toEqual(['mine']);
  });

  test('respects the existing board user filter', () => {
    const dueDate = new Date('2026-08-20T12:00:00.000Z');
    const state = createState({
      cards: [
        { id: 'mine', dueDate, userIds: [CURRENT_USER_ID] },
        { id: 'theirs', dueDate, userIds: [OTHER_USER_ID] },
      ],
      filterUserIds: [OTHER_USER_ID],
    });

    expect(selectCalendarEventsForCurrentBoard(state).map(({ id }) => id)).toEqual(['theirs']);
  });

  test('respects the existing board search filter', () => {
    const dueDate = new Date('2026-08-20T12:00:00.000Z');
    const state = createState({
      cards: [
        { id: 'matching', name: 'Release calendar', dueDate },
        { id: 'hidden', name: 'Unrelated work', dueDate },
      ],
      search: 'calendar',
    });

    expect(selectCalendarEventsForCurrentBoard(state).map(({ id }) => id)).toEqual(['matching']);
  });

  test('respects the existing board label filter and exposes labelIds', () => {
    const dueDate = new Date('2026-08-20T12:00:00.000Z');
    const state = createState({
      cards: [
        { id: 'first', dueDate, labelIds: ['label-1'] },
        { id: 'second', dueDate, labelIds: ['label-2'] },
      ],
      filterLabelIds: ['label-2'],
    });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([
      expect.objectContaining({
        id: 'second',
        extendedProps: expect.objectContaining({ labelIds: ['label-2'] }),
      }),
    ]);
  });

  test('exposes one existing PLANKA label color for an event', () => {
    const state = createState({
      cards: [
        {
          id: 'card-1',
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
          labelIds: ['label-1'],
        },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state)[0].extendedProps.labels).toEqual([
      { id: 'label-1', name: 'First label', color: 'berry-red' },
    ]);
  });

  test('exposes multiple existing PLANKA label colors in label order', () => {
    const state = createState({
      cards: [
        {
          id: 'card-1',
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
          labelIds: ['label-1', 'label-2'],
        },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state)[0].extendedProps.labels).toEqual([
      { id: 'label-1', name: 'First label', color: 'berry-red' },
      { id: 'label-2', name: 'Second label', color: 'lagoon-blue' },
    ]);
  });

  test('reflects a label color change from the existing Redux ORM state', () => {
    const dueDate = new Date('2026-08-20T12:00:00.000Z');
    const beforeState = createState({
      cards: [{ id: 'card-1', dueDate, labelIds: ['label-1'] }],
    });
    const afterState = createState({
      cards: [{ id: 'card-1', dueDate, labelIds: ['label-2'] }],
    });

    expect(selectCalendarEventsForCurrentBoard(beforeState)[0].extendedProps.labels[0].color).toBe(
      'berry-red',
    );
    expect(selectCalendarEventsForCurrentBoard(afterState)[0].extendedProps.labels[0].color).toBe(
      'lagoon-blue',
    );
  });

  test('includes cards from a closed list', () => {
    const state = createState({
      cards: [
        {
          id: 'closed-card',
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
          listType: ListTypes.CLOSED,
        },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state).map(({ id }) => id)).toEqual(['closed-card']);
  });

  test.each([ListTypes.ARCHIVE, ListTypes.TRASH])('excludes cards from the %s list', (listType) => {
    const state = createState({
      cards: [
        {
          id: `${listType}-card`,
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
          listType,
        },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([]);
  });

  test('excludes cards from another board', () => {
    const state = createState({
      cards: [
        {
          id: 'other-board-card',
          boardId: 'board-2',
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
        },
      ],
    });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([]);
  });

  test('preserves a native Date near midnight without normalizing it', () => {
    const nearMidnight = new Date('2026-03-29T00:30:00.000Z');
    const state = createState({
      cards: [{ id: 'dst-card', dueDate: nearMidnight }],
    });

    const [{ start }] = selectCalendarEventsForCurrentBoard(state);

    expect(start).toBe(nearMidnight);
    expect(start.toISOString()).toBe('2026-03-29T00:30:00.000Z');
  });

  test('preserves a range across a daylight-saving boundary', () => {
    const startDate = new Date('2026-03-28T23:30:00.000Z');
    const dueDate = new Date('2026-03-29T02:30:00.000Z');
    const state = createState({
      cards: [{ id: 'dst-range', startDate, dueDate }],
    });

    const [{ start, end }] = selectCalendarEventsForCurrentBoard(state);

    expect(start).toBe(startDate);
    expect(end).toBe(dueDate);
  });

  test('preserves the normal local due-date slot used by Week and Agenda', () => {
    const localDueDate = new Date(2026, 7, 20, 9, 30);
    const state = createState({
      cards: [{ id: 'local-card', dueDate: localDueDate }],
    });

    const [{ start }] = selectCalendarEventsForCurrentBoard(state);

    expect(start).toBe(localDueDate);
    expect([start.getDay(), start.getHours(), start.getMinutes()]).toEqual([
      localDueDate.getDay(),
      9,
      30,
    ]);
  });

  test('is memoized for unchanged state', () => {
    const state = createState({
      cards: [{ id: 'card-1', dueDate: new Date('2026-08-20T12:00:00.000Z') }],
    });

    expect(selectCalendarEventsForCurrentBoard(state)).toBe(
      selectCalendarEventsForCurrentBoard(state),
    );
  });

  test('detects due-date cards before active filters are applied', () => {
    const state = createState({
      cards: [
        {
          id: 'filtered-out',
          dueDate: new Date('2026-08-20T12:00:00.000Z'),
          userIds: [CURRENT_USER_ID],
        },
      ],
      filterUserIds: [OTHER_USER_ID],
    });

    expect(selectCalendarEventsForCurrentBoard(state)).toEqual([]);
    expect(selectHasDueDateCardsForCurrentBoard(state)).toBe(true);
  });
});
