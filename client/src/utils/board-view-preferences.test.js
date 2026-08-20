/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { BoardContexts, BoardViews } from '../constants/Enums';
import {
  BOARD_VIEW_ORDER,
  getFallbackBoardView,
  getVisibleBoardViewsForContext,
  loadVisibleBoardViews,
  saveVisibleBoardViews,
  setBoardViewVisibility,
} from './board-view-preferences';

const USER_ID = 'user-1';

const createStorage = (initialValue) => {
  const values = new Map();
  if (initialValue !== undefined) {
    values.set(`planka:visible-board-views:${USER_ID}`, initialValue);
  }

  return {
    getItem: jest.fn((key) => values.get(key) ?? null),
    setItem: jest.fn((key, value) => values.set(key, value)),
  };
};

describe('board view preferences', () => {
  test('defaults to every board view for existing users', () => {
    expect(loadVisibleBoardViews(USER_ID, createStorage())).toEqual(BOARD_VIEW_ORDER);
  });

  test.each([BoardViews.GRID, BoardViews.LIST, BoardViews.CALENDAR])(
    'can hide the %s view',
    (view) => {
      expect(setBoardViewVisibility(BOARD_VIEW_ORDER, view, false)).toEqual(
        BOARD_VIEW_ORDER.filter((candidateView) => candidateView !== view),
      );
    },
  );

  test('restores a saved preference after a reload', () => {
    const storage = createStorage();
    const visibleViews = [BoardViews.KANBAN, BoardViews.CALENDAR];

    saveVisibleBoardViews(USER_ID, visibleViews, storage);

    expect(loadVisibleBoardViews(USER_ID, storage)).toEqual(visibleViews);
  });

  test.each(['not json', JSON.stringify([]), JSON.stringify(['unknown']), '{}'])(
    'falls back from an invalid stored value: %s',
    (storedValue) => {
      expect(loadVisibleBoardViews(USER_ID, createStorage(storedValue))).toEqual(BOARD_VIEW_ORDER);
    },
  );

  test('does not hide the final visible view', () => {
    expect(setBoardViewVisibility([BoardViews.CALENDAR], BoardViews.CALENDAR, false)).toEqual([
      BoardViews.CALENDAR,
    ]);
  });

  test('selects a valid remaining view when the active view is hidden', () => {
    const visibleViews = setBoardViewVisibility(BOARD_VIEW_ORDER, BoardViews.KANBAN, false);

    expect(getFallbackBoardView(visibleViews)).toBe(BoardViews.GRID);
  });

  test('keeps archive and trash view navigation independent from board preferences', () => {
    const boardPreference = [BoardViews.KANBAN, BoardViews.CALENDAR];

    expect(getVisibleBoardViewsForContext(BoardContexts.ARCHIVE, boardPreference)).toEqual([
      BoardViews.GRID,
      BoardViews.LIST,
    ]);
    expect(getVisibleBoardViewsForContext(BoardContexts.TRASH, boardPreference)).toEqual([
      BoardViews.GRID,
      BoardViews.LIST,
    ]);
  });

  test('keeps the canonical order when a hidden view is enabled again', () => {
    expect(
      setBoardViewVisibility(
        [BoardViews.KANBAN, BoardViews.LIST, BoardViews.CALENDAR],
        BoardViews.GRID,
        true,
      ),
    ).toEqual(BOARD_VIEW_ORDER);
  });
});
