/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Checkbox, Icon } from 'semantic-ui-react';
import { Popup } from '../../../../lib/custom-ui';

import { BoardViews } from '../../../../constants/Enums';
import { BoardViewIcons } from '../../../../constants/Icons';
import { BOARD_VIEW_ORDER } from '../../../../utils/board-view-preferences';

import styles from './ManageViewsStep.module.scss';

const ManageViewsStep = React.memo(({ visibleViews, onToggle, onBack }) => {
  const [t] = useTranslation();

  const handleChange = useCallback(
    (_, { checked, value }) => {
      onToggle(value, checked);
    },
    [onToggle],
  );

  return (
    <>
      <Popup.Header onBack={onBack}>{t('common.manageViews', { context: 'title' })}</Popup.Header>
      <Popup.Content>
        <div className={styles.items}>
          {BOARD_VIEW_ORDER.map((view) => {
            const isVisible = visibleViews.includes(view);
            const isLastVisible = isVisible && visibleViews.length === 1;

            return (
              <div key={view} className={styles.item}>
                <Icon name={BoardViewIcons[view]} className={styles.icon} />
                <span className={styles.name}>{t(`common.${view}`)}</span>
                <Checkbox
                  toggle
                  value={view}
                  checked={isVisible}
                  disabled={isLastVisible}
                  aria-label={t('common.toggleBoardViewVisibility', {
                    view: t(`common.${view}`),
                  })}
                  onChange={handleChange}
                />
              </div>
            );
          })}
        </div>
        <p className={styles.hint}>{t('common.atLeastOneBoardViewMustRemain')}</p>
      </Popup.Content>
    </>
  );
});

ManageViewsStep.propTypes = {
  visibleViews: PropTypes.arrayOf(PropTypes.oneOf(Object.values(BoardViews))).isRequired,
  onToggle: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default ManageViewsStep;
