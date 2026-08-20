/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { BoardContexts, BoardViews } from '../constants/Enums';

export const BOARD_VIEW_PREFERENCE_KEY_PREFIX = 'planka:visible-board-views:';

export const BOARD_VIEW_ORDER = Object.freeze([
  BoardViews.KANBAN,
  BoardViews.GRID,
  BoardViews.LIST,
  BoardViews.CALENDAR,
]);

const NON_BOARD_CONTEXT_VIEWS = Object.freeze([BoardViews.GRID, BoardViews.LIST]);

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const getPreferenceKey = (userId) => `${BOARD_VIEW_PREFERENCE_KEY_PREFIX}${userId}`;

export const normalizeVisibleBoardViews = (value) => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    new Set(value).size !== value.length ||
    value.some((view) => !BOARD_VIEW_ORDER.includes(view))
  ) {
    return [...BOARD_VIEW_ORDER];
  }

  return BOARD_VIEW_ORDER.filter((view) => value.includes(view));
};

export const loadVisibleBoardViews = (userId, storage = getStorage()) => {
  if (!userId || !storage) {
    return [...BOARD_VIEW_ORDER];
  }

  try {
    const storedValue = storage.getItem(getPreferenceKey(userId));

    if (storedValue === null) {
      return [...BOARD_VIEW_ORDER];
    }

    return normalizeVisibleBoardViews(JSON.parse(storedValue));
  } catch {
    return [...BOARD_VIEW_ORDER];
  }
};

export const saveVisibleBoardViews = (userId, visibleViews, storage = getStorage()) => {
  const normalizedViews = normalizeVisibleBoardViews(visibleViews);

  if (!userId || !storage) {
    return normalizedViews;
  }

  try {
    storage.setItem(getPreferenceKey(userId), JSON.stringify(normalizedViews));
  } catch {
    // Browser privacy modes and storage quotas must not break board navigation.
  }

  return normalizedViews;
};

export const setBoardViewVisibility = (visibleViews, view, isVisible) => {
  const normalizedViews = normalizeVisibleBoardViews(visibleViews);

  if (!BOARD_VIEW_ORDER.includes(view)) {
    return normalizedViews;
  }

  if (isVisible) {
    return BOARD_VIEW_ORDER.filter(
      (candidateView) => candidateView === view || normalizedViews.includes(candidateView),
    );
  }

  if (!normalizedViews.includes(view) || normalizedViews.length === 1) {
    return normalizedViews;
  }

  return normalizedViews.filter((candidateView) => candidateView !== view);
};

export const getVisibleBoardViewsForContext = (context, visibleViews) => {
  if (context !== BoardContexts.BOARD) {
    return [...NON_BOARD_CONTEXT_VIEWS];
  }

  return normalizeVisibleBoardViews(visibleViews);
};

export const getFallbackBoardView = (visibleViews) => normalizeVisibleBoardViews(visibleViews)[0];
