/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Checkbox, Icon } from 'semantic-ui-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import { push } from '../../../lib/redux-router';
import { usePopup } from '../../../lib/popup';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

import selectors from '../../../selectors';
import Paths from '../../../constants/Paths';
import {
  CalendarViews,
  changeCalendarView,
  goToCalendarMonth,
  loadCalendarView,
  navigateCalendar,
  saveCalendarView,
} from '../../../utils/calendar-preferences';
import { loadFullCalendarLocale } from '../../../utils/fullcalendar-locales';
import MonthPickerStep from './MonthPickerStep';

import styles from './CalendarView.module.scss';
import globalStyles from '../../../styles.module.scss';

const NAVIGATION_ACTIONS = ['prev', 'today', 'next'];

const CalendarView = React.memo(() => {
  const events = useSelector(selectors.selectCalendarEventsForCurrentBoard);
  const myEvents = useSelector(selectors.selectMyCalendarEventsForCurrentBoard);
  const hasDueDateCards = useSelector(selectors.selectHasDueDateCardsForCurrentBoard);
  const currentUserId = useSelector(selectors.selectCurrentUserId);

  const dispatch = useDispatch();
  const [t, i18n] = useTranslation();
  const calendarRef = useRef(null);
  const initialCalendarViewRef = useRef(loadCalendarView(currentUserId));
  const [calendarView, setCalendarView] = useState(initialCalendarViewRef.current);
  const [displayedDate, setDisplayedDate] = useState(() => new Date());
  const [fullCalendarLocale, setFullCalendarLocale] = useState('en');
  const [isMyTasksOnly, setIsMyTasksOnly] = useState(false);

  const language = i18n.resolvedLanguage || 'en-US';
  const visibleEvents = isMyTasksOnly ? myEvents : events;

  useEffect(() => {
    let isCurrent = true;

    loadFullCalendarLocale(language).then((locale) => {
      if (isCurrent) {
        setFullCalendarLocale(locale);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [language]);

  const plugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, listPlugin, classicThemePlugin],
    [],
  );

  const calendarViewOptions = useMemo(
    () => [
      { value: CalendarViews.MONTH, label: t('common.month') },
      { value: CalendarViews.WEEK, label: t('common.week') },
      { value: CalendarViews.AGENDA, label: t('common.agenda') },
    ],
    [t],
  );

  const displayedPeriod = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        month: 'long',
        year: 'numeric',
      }).format(displayedDate),
    [displayedDate, language],
  );

  const getCalendarApi = useCallback(() => calendarRef.current && calendarRef.current.getApi(), []);

  const handleMyTasksChange = useCallback((_, { checked }) => {
    setIsMyTasksOnly(checked);
  }, []);

  const handleNavigationClick = useCallback(
    ({ currentTarget: { value } }) => {
      navigateCalendar(getCalendarApi(), value);
    },
    [getCalendarApi],
  );

  const handleCalendarViewChange = useCallback(
    ({ currentTarget: { value } }) => {
      if (changeCalendarView(getCalendarApi(), value)) {
        setCalendarView(saveCalendarView(currentUserId, value));
      }
    },
    [currentUserId, getCalendarApi],
  );

  const handleMonthSelect = useCallback(
    (year, month) => {
      goToCalendarMonth(getCalendarApi(), year, month);
    },
    [getCalendarApi],
  );

  const handleDatesSet = useCallback(({ view }) => {
    setDisplayedDate(view.calendar.getDate());

    if (Object.values(CalendarViews).includes(view.type)) {
      setCalendarView(view.type);
    }
  }, []);

  const handleEventClick = useCallback(
    ({ event }) => {
      dispatch(push(Paths.CARDS.replace(':id', event.extendedProps.cardId)));
    },
    [dispatch],
  );

  const renderEventContent = useCallback(({ event, timeText }) => {
    const labels = event.extendedProps.labels || [];

    return (
      <div className={styles.eventContent} title={event.title}>
        {timeText && <span className={styles.eventTime}>{timeText}</span>}
        {labels.length > 0 && (
          <span className={styles.labelMarkers} aria-hidden="true">
            {labels.map((label) => (
              <span
                key={label.id}
                className={classNames(
                  styles.labelMarker,
                  globalStyles[`background${upperFirst(camelCase(label.color))}`],
                )}
              />
            ))}
          </span>
        )}
        <span className={styles.eventTitle}>{event.title}</span>
      </div>
    );
  }, []);

  const MonthPickerPopup = usePopup(MonthPickerStep, {
    position: 'bottom left',
  });

  let emptyState = null;
  if (visibleEvents.length === 0) {
    emptyState = hasDueDateCards
      ? t('common.noCardsMatchCurrentFilters')
      : t('common.noCardsWithDueDate');
  }

  return (
    <div className={styles.wrapper} data-testid="calendar-view">
      <div className={styles.toolbar} data-testid="calendar-toolbar">
        <div className={styles.toolbarPrimary}>
          <MonthPickerPopup date={displayedDate} locale={language} onSelect={handleMonthSelect}>
            <button
              type="button"
              aria-haspopup="dialog"
              title={t('common.selectMonthAndYear', { context: 'title' })}
              className={classNames(styles.toolbarButton, styles.periodButton)}
            >
              <span>{displayedPeriod}</span>
              <Icon fitted name="dropdown" />
            </button>
          </MonthPickerPopup>
          <div className={styles.navigation}>
            {NAVIGATION_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                value={action}
                title={t(`common.calendarNavigation_${action}`)}
                aria-label={t(`common.calendarNavigation_${action}`)}
                className={classNames(
                  styles.toolbarButton,
                  action === 'today' && styles.todayButton,
                )}
                onClick={handleNavigationClick}
              >
                {action === 'prev' && <Icon fitted name="chevron left" />}
                {action === 'today' && t('common.today')}
                {action === 'next' && <Icon fitted name="chevron right" />}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarSecondary}>
          <Checkbox
            toggle
            checked={isMyTasksOnly}
            label={t('common.myTasks')}
            onChange={handleMyTasksChange}
          />
          <label htmlFor="calendar-view-select" className={styles.viewSelectLabel}>
            <span className={styles.screenReaderOnly}>{t('common.calendarView')}</span>
            <select
              id="calendar-view-select"
              value={calendarView}
              aria-label={t('common.calendarView')}
              className={styles.viewSelect}
              onChange={handleCalendarViewChange}
            >
              {calendarViewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon fitted name="dropdown" className={styles.viewSelectIcon} />
          </label>
        </div>
      </div>
      <div className={styles.calendar} data-calendar-view={calendarView}>
        <FullCalendar
          ref={calendarRef}
          className={styles.fullCalendar}
          plugins={plugins}
          themeSystem="classic"
          initialView={initialCalendarViewRef.current}
          locale={fullCalendarLocale}
          timeZone="local"
          events={visibleEvents}
          eventOrder="start,title"
          eventClass="calendar-card-event"
          eventColor="var(--calendar-event-color)"
          editable={false}
          selectable={false}
          navLinks={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          headerToolbar={false}
          dayMaxEvents
          nowIndicator
          stickyHeaderDates
          height="100%"
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
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
