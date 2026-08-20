/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Checkbox, Icon } from 'semantic-ui-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import deLocale from '@fullcalendar/react/locales/de';
import { push } from '../../../lib/redux-router';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

import selectors from '../../../selectors';
import Paths from '../../../constants/Paths';

import styles from './CalendarView.module.scss';

const CalendarView = React.memo(() => {
  const events = useSelector(selectors.selectCalendarEventsForCurrentBoard);
  const myEvents = useSelector(selectors.selectMyCalendarEventsForCurrentBoard);
  const hasDueDateCards = useSelector(selectors.selectHasDueDateCardsForCurrentBoard);

  const dispatch = useDispatch();
  const [t, i18n] = useTranslation();
  const [isMyTasksOnly, setIsMyTasksOnly] = useState(false);

  const visibleEvents = isMyTasksOnly ? myEvents : events;
  const locale = i18n.resolvedLanguage === 'de-DE' ? deLocale : 'en';

  const plugins = useMemo(() => [dayGridPlugin, classicThemePlugin], []);

  const handleMyTasksChange = useCallback((_, { checked }) => {
    setIsMyTasksOnly(checked);
  }, []);

  const handleEventClick = useCallback(
    ({ event }) => {
      dispatch(push(Paths.CARDS.replace(':id', event.extendedProps.cardId)));
    },
    [dispatch],
  );

  let emptyState = null;
  if (visibleEvents.length === 0) {
    emptyState = hasDueDateCards
      ? t('common.noCardsMatchCurrentFilters')
      : t('common.noCardsWithDueDate');
  }

  return (
    <div className={styles.wrapper} data-testid="calendar-view">
      <div className={styles.controls}>
        <Checkbox
          toggle
          checked={isMyTasksOnly}
          label={t('common.myTasks')}
          onChange={handleMyTasksChange}
        />
      </div>
      <div className={styles.calendar}>
        <FullCalendar
          className={styles.fullCalendar}
          plugins={plugins}
          themeSystem="classic"
          initialView="dayGridMonth"
          locale={locale}
          timeZone="local"
          events={visibleEvents}
          eventClass="calendar-card-event"
          editable={false}
          selectable={false}
          navLinks={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          height="100%"
          eventClick={handleEventClick}
        />
        {emptyState && (
          <div className={styles.emptyState} role="status">
            <Icon name="calendar outline" size="large" />
            <span>{emptyState}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default CalendarView;
