/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';
import { usePopup } from '../../../../lib/popup';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { BoardContexts } from '../../../../constants/Enums';
import { BoardViewIcons } from '../../../../constants/Icons';
import ActionsStep from './ActionsStep';
import {
  getFallbackBoardView,
  getVisibleBoardViewsForContext,
  loadVisibleBoardViews,
  saveVisibleBoardViews,
  setBoardViewVisibility,
} from '../../../../utils/board-view-preferences';

import styles from './RightSide.module.scss';

const RightSide = React.memo(() => {
  const board = useSelector(selectors.selectCurrentBoard);
  const currentUserId = useSelector(selectors.selectCurrentUserId);

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [visibleViews, setVisibleViews] = useState(() => loadVisibleBoardViews(currentUserId));

  useEffect(() => {
    setVisibleViews(loadVisibleBoardViews(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    if (board.context === BoardContexts.BOARD && !visibleViews.includes(board.view)) {
      dispatch(entryActions.updateViewInCurrentBoard(getFallbackBoardView(visibleViews)));
    }
  }, [board.context, board.view, dispatch, visibleViews]);

  const handleSelectViewClick = useCallback(
    ({ currentTarget: { value: view } }) => {
      dispatch(entryActions.updateViewInCurrentBoard(view));
    },
    [dispatch],
  );

  const ActionsPopup = usePopup(ActionsStep);

  const handleToggleView = useCallback(
    (view, isVisible) => {
      const nextVisibleViews = setBoardViewVisibility(visibleViews, view, isVisible);

      if (nextVisibleViews === visibleViews) {
        return;
      }

      setVisibleViews(saveVisibleBoardViews(currentUserId, nextVisibleViews));

      if (!nextVisibleViews.includes(board.view)) {
        dispatch(entryActions.updateViewInCurrentBoard(getFallbackBoardView(nextVisibleViews)));
      }
    },
    [board.view, currentUserId, dispatch, visibleViews],
  );

  const views = getVisibleBoardViewsForContext(board.context, visibleViews);

  return (
    <>
      <div className={styles.action}>
        <div className={styles.buttonGroup}>
          {views.map((view) => (
            <button
              key={view}
              type="button"
              value={view}
              disabled={view === board.view}
              title={t(`common.${view}`)}
              aria-label={t(`common.${view}`)}
              className={styles.button}
              onClick={handleSelectViewClick}
            >
              <Icon fitted name={BoardViewIcons[view]} />
            </button>
          ))}
        </div>
      </div>
      <div className={styles.action}>
        <ActionsPopup visibleViews={visibleViews} onToggleView={handleToggleView}>
          <button
            type="button"
            title={t('common.boardActions', { context: 'title' })}
            aria-label={t('common.boardActions', { context: 'title' })}
            className={styles.button}
          >
            <Icon fitted name="ellipsis vertical" />
          </button>
        </ActionsPopup>
      </div>
    </>
  );
});

export default RightSide;
