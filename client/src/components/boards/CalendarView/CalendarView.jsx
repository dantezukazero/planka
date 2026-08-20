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
import interactionPlugin from '@fullcalendar/react/interaction';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import { push } from '../../../lib/redux-router';
import { usePopup } from '../../../lib/popup';

import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import { BoardMembershipRoles } from '../../../constants/Enums';
import {
  CalendarViews,
  changeCalendarView,
  goToCalendarMonth,
  loadCalendarView,
  navigateCalendar,
  saveCalendarView,
} from '../../../utils/calendar-preferences';
import { loadFullCalendarLocale } from '../../../utils/fullcalendar-locales';
import {
  CALENDAR_VISUAL_DURATION_OPTIONS,
  getCalendarEventClassName,
  getCalendarEventTimeText,
} from '../../../utils/calendar-event-display';
import {
  applyCalendarEditingPermissions,
  getCalendarEventDropUpdate,
  getCalendarEventResizeRollbackUpdate,
  getCalendarEventResizeUpdate,
  saveCalendarEventChange,
} from '../../../utils/calendar-event-editing';
import MonthPickerStep from './MonthPickerStep';

import styles from './CalendarView.module.scss';
import globalStyles from '../../../styles.module.scss';

const NAVIGATION_ACTIONS = ['prev', 'today', 'next'];

const CalendarView = React.memo(() => {
  const events = useSelector(selectors.selectCalendarEventsForCurrentBoard);
  const myEvents = useSelector(selectors.selectMyCalendarEventsForCurrentBoard);
  const hasDueDateCards = useSelector(selectors.selectHasDueDateCardsForCurrentBoard);
  const currentUserId = useSelector(selectors.selectCurrentUserId);
  const canEditDates = useSelector((state) => {
    const boardMembership = selectors.selectCurrentUserMembershipForCurrentBoard(state);

    return !!boardMembership && boardMembership.role === BoardMembershipRoles.EDITOR;
  });

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
  const editableEvents = useMemo(
    () => applyCalendarEditingPermissions(visibleEvents, canEditDates),
    [canEditDates, visibleEvents],
  );

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
    () => [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, classicThemePlugin],
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

  const saveEventChange = useCallback(
    ({ event, oldEvent, revert }, getUpdate, getRollbackUpdate) => {
      saveCalendarEventChange({
        event,
        oldEvent,
        revert,
        getUpdate,
        getRollbackUpdate,
        updateCard: (cardId, data, options) => {
          dispatch(entryActions.updateCard(cardId, data, options));
        },
      });
    },
    [dispatch],
  );

  const handleEventDrop = useCallback(
    (info) => {
      saveEventChange(info, getCalendarEventDropUpdate);
    },
    [saveEventChange],
  );

  const handleEventResize = useCallback(
    (info) => {
      saveEventChange(info, getCalendarEventResizeUpdate, getCalendarEventResizeRollbackUpdate);
    },
    [saveEventChange],
  );

  const renderEventContent = useCallback(
    ({ event, timeText }) => {
      const labels = event.extendedProps.labels || [];
      const visibleTimeText = getCalendarEventTimeText(event, timeText, language);

      return (
        <div className={styles.eventContent} title={event.title}>
          {visibleTimeText && <span className={styles.eventTime}>{visibleTimeText}</span>}
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
    },
    [language],
  );

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
          forceEventDuration={CALENDAR_VISUAL_DURATION_OPTIONS.forceEventDuration}
          defaultTimedEventDuration={CALENDAR_VISUAL_DURATION_OPTIONS.defaultTimedEventDuration}
          allDayMaintainDuration
          events={editableEvents}
          eventOrder="start,title"
          eventClass={getCalendarEventClassName}
          eventBeforeClass="calendar-card-start-resize-handle"
          eventAfterClass="calendar-card-end-resize-handle"
          eventColor="var(--calendar-event-background)"
          eventContrastColor="var(--calendar-event-text)"
          moreLinkClass="calendar-more-link"
          popoverClass={styles.morePopover}
          popoverCloseClass={styles.morePopoverClose}
          editable={canEditDates}
          selectable={false}
          navLinks={false}
          eventStartEditable={canEditDates}
          eventDurationEditable={canEditDates}
          eventResizableFromStart={canEditDates}
          headerToolbar={false}
          dayMaxEvents
          nowIndicator
          stickyHeaderDates
          height="100%"
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
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
